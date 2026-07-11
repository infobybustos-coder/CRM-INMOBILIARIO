"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria, COOKIE_VISTA_COMO } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { limiteAdmins, limiteEmpleados } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site-url";
import { monedaVisitante } from "@/lib/geo";
import { lineItemMultimoneda } from "@/lib/stripe-checkout";

export type RolInvitable = "empleado" | "admin";

function revalidarEquipo(id?: string) {
  revalidatePath("/inmobiliaria/agentes");
  revalidatePath("/inmobiliaria/administradores");
  revalidatePath("/inmobiliaria/usuarios");
  if (id) revalidatePath(`/inmobiliaria/usuarios/${id}`);
}

export type InvitarState =
  | { error: string }
  | { requierePlanPro: true }
  | { ok: true; link: string }
  | null;

type AsientoResultado = { error: string } | { requierePlanPro: true } | { ok: true };
export type AmpliarState = AsientoResultado | null;

// Un administrador o asesor desactivado sigue contando como asiento
// ocupado (no se libera al desactivar): así nadie puede rotar cuentas
// para esquivar el límite del plan sin pagar. Solo se libera si el
// usuario se elimina de verdad, no al desactivarlo.
//
// Las invitaciones pendientes de aceptar TAMBIÉN cuentan como asiento
// ocupado: si no fuera así, se podría invitar a cuantos administradores
// o asesores se quisiera sin pagar nunca, ya que hasta que no aceptan no
// existe fila en "usuarios". Solo dejan de contar si expiran o se cancelan.
async function contarMiembros(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  rol: RolInvitable
) {
  const [{ count: countUsuarios }, { count: countInvitaciones }] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("rol", rol),
    supabase
      .from("invitaciones")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("rol", rol)
      .is("usado_en", null)
      .gt("expira_en", new Date().toISOString()),
  ]);
  return (countUsuarios ?? 0) + (countInvitaciones ?? 0);
}

// Cobra un asiento extra contra la MISMA suscripción de Stripe del plan
// PRO (no crea una suscripción aparte): si se cancela el PRO, el asiento
// extra se cancela con él. El cobro se confirma al instante; si falla,
// no se concede el asiento.
async function cobrarAsientoExtra(
  usuario: Awaited<ReturnType<typeof requireAdminInmobiliaria>>,
  rol: RolInvitable,
  config: Awaited<ReturnType<typeof obtenerConfigPlanes>>
): Promise<AsientoResultado> {
  const esAdmin = rol === "admin";
  const esPago = usuario.tenant?.plan_tarifa === "pago";
  if (!esPago) return { requierePlanPro: true };

  const extraPriceId = esAdmin ? config.adminExtraStripePriceId : config.asesorExtraStripePriceId;
  if (!extraPriceId) {
    return {
      error: `Ya tienes el máximo de ${esAdmin ? "administradores" : "asesores"} incluidos en tu plan y todavía no se puede ampliar automáticamente. Contacta con soporte.`,
    };
  }

  const precio = esAdmin ? config.precioAdminExtra : config.precioAsesorExtra;
  const subscriptionId = usuario.tenant?.stripe_subscription_id as string | null | undefined;

  // Si el PRO se activó a mano (antes de conectar Stripe, o por un
  // superadmin), el tenant no tiene una suscripción de Stripe real a la
  // que añadir el asiento: en ese caso abrimos un checkout de verdad en
  // vez de intentar un cobro silencioso en segundo plano.
  if (!subscriptionId) {
    let checkoutUrl: string;
    try {
      const admin = createAdminClient();
      let customerId = usuario.tenant?.stripe_customer_id as string | null | undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: usuario.email,
          metadata: { tenant_id: usuario.tenant_id },
        });
        customerId = customer.id;
        await admin.from("tenants").update({ stripe_customer_id: customerId }).eq("id", usuario.tenant_id);
      }

      const url = await siteUrl();
      const moneda = await monedaVisitante();
      const destino = esAdmin ? "administradores" : "agentes";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [await lineItemMultimoneda(extraPriceId, moneda, precio)],
        custom_fields: [
          {
            key: "email_invitado",
            label: { type: "custom", custom: `Email del ${esAdmin ? "administrador" : "asesor"} a añadir` },
            type: "text",
            text: { minimum_length: 5, maximum_length: 200 },
          },
        ],
        success_url: `${url}/inmobiliaria/${destino}?asiento_pagado=1`,
        cancel_url: `${url}/inmobiliaria/${destino}`,
        metadata: {
          tenant_id: usuario.tenant_id,
          tipo_plan: esAdmin ? "admin_extra" : "asesor_extra",
          invitado_por: usuario.id,
        },
        subscription_data: {
          metadata: { tenant_id: usuario.tenant_id, tipo_plan: esAdmin ? "admin_extra" : "asesor_extra" },
        },
      });
      if (!session.url) return { error: "No se pudo iniciar el pago. Inténtalo de nuevo." };
      checkoutUrl = session.url;
    } catch (err) {
      console.error("Stripe: no se pudo iniciar el pago del asiento extra:", err);
      return { error: "No se pudo iniciar el pago. Inténtalo de nuevo." };
    }
    redirect(checkoutUrl);
  }

  let monedaSuscripcion = "eur";

  try {
    // El importe se genera al vuelo con price_data (mismo producto, mismo
    // importe numérico) porque cada suscripción de Stripe tiene una única
    // moneda fija: hay que usar la que ya tenga la suscripción del
    // tenant, no la del visitante actual (puede que quien compre el
    // asiento extra no esté en el mismo país que cuando se dio de alta).
    const precioBase = await stripe.prices.retrieve(extraPriceId);
    const productId = typeof precioBase.product === "string" ? precioBase.product : precioBase.product.id;

    const items = await stripe.subscriptionItems.list({ subscription: subscriptionId, limit: 100 });
    const existente = items.data.find((i) => {
      const prodId = typeof i.price.product === "string" ? i.price.product : i.price.product.id;
      return prodId === productId;
    });
    monedaSuscripcion = items.data[0]?.price.currency ?? "eur";

    await stripe.subscriptions.update(subscriptionId, {
      items: [
        existente
          ? { id: existente.id, quantity: (existente.quantity ?? 0) + 1 }
          : {
              price_data: {
                currency: monedaSuscripcion,
                product: productId,
                unit_amount: Math.round(precio * 100),
                recurring: { interval: "month" },
              },
              quantity: 1,
            },
      ],
      proration_behavior: "always_invoice",
      payment_behavior: "error_if_incomplete",
    });
  } catch (err) {
    console.error("Stripe: no se pudo cobrar el asiento extra:", err);
    return {
      error: "No se pudo cobrar el asiento adicional. Comprueba el método de pago de tu suscripción e inténtalo de nuevo.",
    };
  }

  const admin = createAdminClient();
  const extraActual = esAdmin ? (usuario.tenant?.admins_extra ?? 0) : (usuario.tenant?.agentes_extra ?? 0);
  const { error: errorExtra } = await admin
    .from("tenants")
    .update({ [esAdmin ? "admins_extra" : "agentes_extra"]: extraActual + 1 })
    .eq("id", usuario.tenant_id);
  if (errorExtra) return { error: "El pago se cobró pero no se pudo ampliar el plan. Contacta con soporte." };

  await admin.from("pedidos").insert({
    tenant_id: usuario.tenant_id,
    tipo: "ajuste_manual",
    concepto: esAdmin ? "Administrador adicional" : "Asesor adicional",
    importe: precio,
    moneda: monedaSuscripcion.toUpperCase(),
    metodo_pago: "Tarjeta (Stripe)",
    estado: "pagado",
    confirmado_en: new Date().toISOString(),
    confirmado_por: "Stripe (automático)",
  });

  return { ok: true };
}

// Se llama ANTES de pedir el email: si ya se ha llegado al límite, cobra
// el asiento extra (o avisa de que hace falta plan PRO) sin haber
// recogido todavía ningún dato del nuevo miembro.
export async function ampliarAsientoSiHaceFalta(rol: RolInvitable): Promise<AmpliarState> {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();

  const totalMiembros = await contarMiembros(supabase, usuario.tenant_id, rol);
  const config = await obtenerConfigPlanes();
  const esAdmin = rol === "admin";
  const limite = esAdmin ? limiteAdmins(config, usuario.tenant ?? {}) : limiteEmpleados(config, usuario.tenant ?? {});

  if (totalMiembros < limite) return { ok: true };

  const resultado = await cobrarAsientoExtra(usuario, rol, config);
  if ("ok" in resultado) {
    revalidarEquipo();
    revalidatePath("/inmobiliaria/suscripcion");
  }
  return resultado;
}

export async function invitarMiembro(
  rol: RolInvitable,
  _prevState: InvitarState,
  formData: FormData
): Promise<InvitarState> {
  const usuario = await requireAdminInmobiliaria();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) return { error: "Pon un email válido." };

  const supabase = await createClient();

  const { data: existente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("tenant_id", usuario.tenant_id)
    .eq("email", email)
    .maybeSingle();
  if (existente) return { error: "Ya hay un usuario con ese email en tu equipo." };

  const totalMiembros = await contarMiembros(supabase, usuario.tenant_id, rol);
  const config = await obtenerConfigPlanes();
  const esAdmin = rol === "admin";
  // Los asientos extra solo cuentan si el plan es de pago; en Gratis nunca
  // se pueden comprar, así que el límite se calcula igual en ambos casos con
  // las mismas funciones que usan Administradores/Agentes/Suscripción.
  const limite = esAdmin ? limiteAdmins(config, usuario.tenant ?? {}) : limiteEmpleados(config, usuario.tenant ?? {});

  // Red de seguridad: si por lo que sea se llega hasta aquí sin haber
  // pagado el asiento extra todavía (el flujo normal ya lo cobra antes de
  // mostrar este formulario), se cobra aquí y no se crea la invitación si
  // el pago falla.
  if (totalMiembros >= limite) {
    const resultado = await cobrarAsientoExtra(usuario, rol, config);
    if (!("ok" in resultado)) return resultado;
  }

  const token = randomUUID();
  const { error } = await supabase.from("invitaciones").insert({
    tenant_id: usuario.tenant_id,
    email,
    rol,
    token,
    invitado_por: usuario.id,
  });
  if (error) return { error: "No se pudo crear la invitación." };

  const listaHeaders = await headers();
  const host = listaHeaders.get("host");
  const protocolo = host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https";
  const link = `${protocolo}://${host}/invitar/${token}`;

  revalidarEquipo();
  return { ok: true, link };
}

// Como una invitación pendiente ocupa un asiento del plan, cancelarla
// es la única forma de liberarlo si te equivocaste de email o ya no
// quieres invitar a esa persona.
export async function cancelarInvitacion(id: string) {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();

  await supabase.from("invitaciones").delete().eq("id", id).eq("tenant_id", usuario.tenant_id);

  revalidarEquipo();
  revalidatePath("/inmobiliaria/suscripcion");
}

export async function eliminarMiembro(id: string) {
  const usuario = await requireAdminInmobiliaria();
  if (id === usuario.id) return;

  const supabase = await createClient();

  // Desactivar NO libera el asiento (sigue contando para el límite del
  // plan, ver contarMiembros): ya se cobró por él y evita que se pueda
  // esquivar el pago desactivando y volviendo a invitar sin parar.
  await supabase
    .from("usuarios")
    .update({ activo: false })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  revalidarEquipo();
  revalidatePath("/inmobiliaria/suscripcion");
}

export type ActualizarMiembroState = { error: string } | { ok: true } | null;

export async function actualizarMiembro(
  id: string,
  _prevState: ActualizarMiembroState,
  formData: FormData
): Promise<ActualizarMiembroState> {
  const usuario = await requireAdminInmobiliaria();
  const nuevoRol = String(formData.get("rol") ?? "");
  const activo = formData.get("activo") === "true";

  if (nuevoRol !== "admin" && nuevoRol !== "empleado") return { error: "Rol no válido." };

  if (id === usuario.id && (nuevoRol !== "admin" || !activo)) {
    return { error: "No puedes cambiar tu propio rol ni desactivarte a ti mismo." };
  }

  const supabase = await createClient();

  const { data: actual } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  if (actual && actual.rol !== "admin" && nuevoRol === "admin") {
    const totalAdmins = await contarMiembros(supabase, usuario.tenant_id, "admin");
    const config = await obtenerConfigPlanes();
    const limite = limiteAdmins(config, usuario.tenant ?? {});
    if (totalAdmins >= limite) {
      const esPago = usuario.tenant?.plan_tarifa === "pago";
      return {
        error: esPago
          ? "Ya tienes el máximo de administradores incluidos en tu plan. Añade uno nuevo desde Administradores para ampliar el plan."
          : "Has alcanzado el límite de administradores de tu plan Free. Cambia al plan PRO desde Suscripción para añadir más.",
      };
    }
  }

  const { error } = await supabase
    .from("usuarios")
    .update({ rol: nuevoRol, activo })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: "No se pudo guardar." };

  revalidarEquipo(id);
  return { ok: true };
}

export async function iniciarVistaComo(id: string) {
  const usuario = await requireAdminInmobiliaria();

  const supabase = await createClient();
  const { data: objetivo } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .eq("rol", "empleado")
    .eq("activo", true)
    .single();

  if (!objetivo) return;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_VISTA_COMO, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/inmobiliaria");
}

export async function salirVistaComo() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_VISTA_COMO);
  redirect("/inmobiliaria");
}
