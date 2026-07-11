"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type PlanTarifa } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { METODOS_PAGO } from "@/lib/metodos-pago";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site-url";

export type CambiarPlanState = { error: string } | { ok: true };

// El paso a PRO ya no se hace aquí: pasa por solicitarUpgradePro, que crea
// un pedido pendiente de confirmación. Esta función solo gestiona la
// vuelta a Gratis (no implica ningún cobro, así que puede ser instantánea).
export async function cambiarPlanTarifa(nuevoPlan: PlanTarifa): Promise<CambiarPlanState> {
  const usuario = await requireAdminInmobiliaria();

  if (nuevoPlan === "pago") {
    return { error: "Usa el flujo de pago para pasar a PRO." };
  }

  if (nuevoPlan === "gratis" && usuario.tenant?.plan_tarifa === "pago") {
    const supabase = await createClient();
    const config = await obtenerConfigPlanes();
    const [{ count: adminsActivos }, { count: empleadosActivos }] = await Promise.all([
      supabase
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", usuario.tenant_id)
        .eq("rol", "admin")
        .eq("activo", true),
      supabase
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", usuario.tenant_id)
        .eq("rol", "empleado")
        .eq("activo", true),
    ]);

    const adminsGratis = config.inmobiliariaFree.administradores;
    const asesoresGratis = config.inmobiliariaFree.asesores;

    const problemas: string[] = [];
    if ((adminsActivos ?? 0) > adminsGratis) {
      problemas.push(`${adminsActivos} administradores (el plan Gratis solo incluye ${adminsGratis})`);
    }
    if ((empleadosActivos ?? 0) > asesoresGratis) {
      problemas.push(`${empleadosActivos} asesores (el plan Gratis solo incluye ${asesoresGratis})`);
    }
    if (problemas.length > 0) {
      return {
        error: `No puedes volver al plan Gratis todavía: tienes ${problemas.join(" y ")}. Elimina o desactiva usuarios hasta esos límites antes de cambiar de plan.`,
      };
    }
  }

  const admin = createAdminClient();
  await admin
    .from("tenants")
    .update({
      plan_tarifa: nuevoPlan,
      // En Gratis no existen los asientos extra: si venía de PRO con alguno
      // comprado, se limpian al bajar de plan.
      ...(nuevoPlan === "gratis" ? { admins_extra: 0, agentes_extra: 0 } : {}),
    })
    .eq("id", usuario.tenant_id);

  revalidatePath("/inmobiliaria/suscripcion");
  revalidatePath("/inmobiliaria/administradores");
  revalidatePath("/inmobiliaria/agentes");
  revalidatePath("/inmobiliaria", "layout");
  return { ok: true };
}

export async function solicitarUpgradePro(metodoPago: string): Promise<CambiarPlanState> {
  const usuario = await requireAdminInmobiliaria();
  if (usuario.tenant?.plan_tarifa === "pago") {
    return { error: "Ya tienes el plan PRO." };
  }

  const admin = createAdminClient();
  const config = await obtenerConfigPlanes();

  // Si hay una pasarela de Stripe conectada (price ID configurado en
  // Suscripciones), el pago es real: se redirige a Stripe Checkout y es
  // el webhook quien confirma el pedido y activa el plan. Si todavía no
  // hay pasarela, se mantiene el flujo manual de siempre.
  if (config.inmobiliariaProStripePriceId) {
    let checkoutUrl: string;
    try {
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
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: config.inmobiliariaProStripePriceId, quantity: 1 }],
        success_url: `${url}/inmobiliaria/suscripcion?pago=exito`,
        cancel_url: `${url}/inmobiliaria/suscripcion/pago?pago=cancelado`,
        metadata: { tenant_id: usuario.tenant_id, tipo_plan: "inmobiliaria" },
        subscription_data: { metadata: { tenant_id: usuario.tenant_id, tipo_plan: "inmobiliaria" } },
      });
      if (!session.url) return { error: "No se pudo iniciar el pago. Inténtalo de nuevo." };
      checkoutUrl = session.url;
    } catch (err) {
      console.error("Stripe checkout error:", err);
      return { error: "No se pudo iniciar el pago. Revisa la configuración de Stripe e inténtalo de nuevo." };
    }
    redirect(checkoutUrl);
  }

  if (!METODOS_PAGO.includes(metodoPago as (typeof METODOS_PAGO)[number])) {
    return { error: "Elige un método de pago válido." };
  }

  const { count: pendientes } = await admin
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", usuario.tenant_id)
    .eq("estado", "iniciado");
  if ((pendientes ?? 0) > 0) {
    return { error: "Ya tienes un pago en revisión. Te avisaremos cuando se confirme." };
  }

  const { error } = await admin.from("pedidos").insert({
    tenant_id: usuario.tenant_id,
    tipo: "plan_pro",
    concepto: "Cambio a Inmobiliaria PRO",
    importe: config.inmobiliariaProPrecio,
    metodo_pago: metodoPago,
  });
  if (error) return { error: "No se pudo registrar la solicitud. Inténtalo de nuevo." };

  revalidatePath("/inmobiliaria/suscripcion");
  revalidatePath("/inmobiliaria/suscripcion/pago");
  return { ok: true };
}
