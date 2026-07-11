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
import { siteUrl } from "@/lib/site-url";

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

  if ((activos ?? 0) >= limite) {
    const esPago = usuario.tenant?.plan_tarifa === "pago";
    if (!esPago) return { requierePlanPro: true };

    const extraPriceId = esAdmin ? config.adminExtraStripePriceId : config.asesorExtraStripePriceId;
    if (!extraPriceId) {
      return {
        error: `Ya tienes el máximo de ${esAdmin ? "administradores" : "asesores"} incluidos en tu plan y todavía no se puede ampliar automáticamente. Contacta con soporte.`,
      };
    }

    // Nunca se crea la invitación ni se amplía el asiento sin que Stripe
    // confirme el cobro real: se abre un checkout y es el webhook quien,
    // al confirmarse el pago, amplía el asiento y crea la invitación.
    let checkoutUrl: string;
    try {
      let customerId = usuario.tenant?.stripe_customer_id as string | null | undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: usuario.email,
          metadata: { tenant_id: usuario.tenant_id },
        });
        customerId = customer.id;
        const admin = createAdminClient();
        await admin.from("tenants").update({ stripe_customer_id: customerId }).eq("id", usuario.tenant_id);
      }

      const url = await siteUrl();
      const destino = esAdmin ? "administradores" : "agentes";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: extraPriceId, quantity: 1 }],
        success_url: `${url}/inmobiliaria/${destino}?asiento_pagado=${encodeURIComponent(email)}`,
        cancel_url: `${url}/inmobiliaria/${destino}`,
        metadata: {
          tenant_id: usuario.tenant_id,
          tipo_plan: esAdmin ? "admin_extra" : "asesor_extra",
          invitado_por: usuario.id,
          email,
          rol,
        },
      });
      if (!session.url) return { error: "No se pudo iniciar el pago. Inténtalo de nuevo." };
      checkoutUrl = session.url;
    } catch (err) {
      console.error("Stripe checkout error (asiento extra):", err);
      return { error: "No se pudo iniciar el pago. Inténtalo de nuevo." };
    }
    redirect(checkoutUrl);
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
