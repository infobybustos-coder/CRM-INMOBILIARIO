"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria, COOKIE_VISTA_COMO } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminsIncluidos, limiteAdmins, limiteEmpleados } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { stripe } from "@/lib/stripe";

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

  const { count: activos } = await supabase
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", usuario.tenant_id)
    .eq("rol", rol)
    .eq("activo", true);

  const config = await obtenerConfigPlanes();
  const esAdmin = rol === "admin";
  // Los asientos extra solo cuentan si el plan es de pago; en Gratis nunca
  // se pueden comprar, así que el límite se calcula igual en ambos casos con
  // las mismas funciones que usan Administradores/Agentes/Suscripción.
  const limite = esAdmin ? limiteAdmins(config, usuario.tenant ?? {}) : limiteEmpleados(config, usuario.tenant ?? {});

  const admin = createAdminClient();

  if ((activos ?? 0) >= limite) {
    const esPago = usuario.tenant?.plan_tarifa === "pago";
    const subscriptionId = usuario.tenant?.stripe_subscription_id as string | null | undefined;
    if (!esPago || !subscriptionId) return { requierePlanPro: true };

    const extraPriceId = esAdmin ? config.adminExtraStripePriceId : config.asesorExtraStripePriceId;
    if (!extraPriceId) {
      return {
        error: `Ya tienes el máximo de ${esAdmin ? "administradores" : "asesores"} incluidos en tu plan y todavía no se puede ampliar automáticamente. Contacta con soporte.`,
      };
    }

    // El asiento extra se factura como una línea más dentro de la MISMA
    // suscripción del plan PRO (no una suscripción aparte): así, si el
    // cliente cancela el PRO, los asientos extra se cancelan con él. El
    // cobro se intenta al instante; si falla, no se concede el asiento ni
    // se crea la invitación.
    try {
      const items = await stripe.subscriptionItems.list({ subscription: subscriptionId, limit: 100 });
      const existente = items.data.find((i) => i.price.id === extraPriceId);

      await stripe.subscriptions.update(subscriptionId, {
        items: [
          existente
            ? { id: existente.id, quantity: (existente.quantity ?? 0) + 1 }
            : { price: extraPriceId, quantity: 1 },
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

    const extraActual = esAdmin ? (usuario.tenant?.admins_extra ?? 0) : (usuario.tenant?.agentes_extra ?? 0);
    const { error: errorExtra } = await admin
      .from("tenants")
      .update({ [esAdmin ? "admins_extra" : "agentes_extra"]: extraActual + 1 })
      .eq("id", usuario.tenant_id);
    if (errorExtra) return { error: "El pago se cobró pero no se pudo ampliar el plan. Contacta con soporte." };

    const precio = esAdmin ? config.precioAdminExtra : config.precioAsesorExtra;
    await admin.from("pedidos").insert({
      tenant_id: usuario.tenant_id,
      tipo: "ajuste_manual",
      concepto: esAdmin ? "Administrador adicional" : "Asesor adicional",
      importe: precio,
      metodo_pago: "Tarjeta (Stripe)",
      estado: "pagado",
      confirmado_en: new Date().toISOString(),
      confirmado_por: "Stripe (automático)",
    });
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

export async function eliminarMiembro(id: string) {
  const usuario = await requireAdminInmobiliaria();
  if (id === usuario.id) return;

  const supabase = await createClient();

  const { data: objetivo } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  await supabase
    .from("usuarios")
    .update({ activo: false })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (objetivo) {
    const config = await obtenerConfigPlanes();
    const esAdmin = objetivo.rol === "admin";

    const { count: activosRestantes } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("rol", objetivo.rol)
      .eq("activo", true);

    const incluidos = esAdmin
      ? adminsIncluidos(config, usuario.tenant ?? {})
      : usuario.tenant?.plan_tarifa === "pago"
        ? config.inmobiliariaProAsesoresIncluidos
        : config.inmobiliariaFree.asesores;
    const nuevoExtra = Math.max(0, (activosRestantes ?? 0) - incluidos);
    const extraActual = esAdmin ? (usuario.tenant?.admins_extra ?? 0) : (usuario.tenant?.agentes_extra ?? 0);

    if (nuevoExtra !== extraActual) {
      const admin = createAdminClient();
      await admin
        .from("tenants")
        .update({ [esAdmin ? "admins_extra" : "agentes_extra"]: nuevoExtra })
        .eq("id", usuario.tenant_id);
    }
  }

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
    const { count: adminsActivos } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("rol", "admin")
      .eq("activo", true);
    const config = await obtenerConfigPlanes();
    const limite = limiteAdmins(config, usuario.tenant ?? {});
    if ((adminsActivos ?? 0) >= limite) {
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
