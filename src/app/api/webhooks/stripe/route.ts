import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

async function activarPlanPro(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenant_id;
  const tipoPlan = session.metadata?.tipo_plan;
  if (!tenantId || (tipoPlan !== "asesor" && tipoPlan !== "inmobiliaria")) return;

  const admin = createAdminClient();
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);
  const customerId = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);

  await admin
    .from("tenants")
    .update({
      plan_tarifa: "pago",
      ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
      ...(customerId ? { stripe_customer_id: customerId } : {}),
    })
    .eq("id", tenantId);

  const importe = (session.amount_total ?? 0) / 100;

  await admin.from("pedidos").insert({
    tenant_id: tenantId,
    tipo: "plan_pro",
    concepto: tipoPlan === "inmobiliaria" ? "Cambio a Inmobiliaria PRO" : "Cambio a Asesor PRO",
    importe,
    metodo_pago: "Tarjeta (Stripe)",
    estado: "pagado",
    confirmado_en: new Date().toISOString(),
    confirmado_por: "Stripe (automático)",
    stripe_checkout_session_id: session.id,
  });

  await admin.from("tenant_eventos").insert({
    tenant_id: tenantId,
    tipo: "plan",
    descripcion: `Pago confirmado por Stripe: ${tipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} PRO (${importe.toFixed(2)}€).`,
  });
}

// Caso de respaldo: un tenant con PRO activado a mano (sin suscripción de
// Stripe todavía) compra un asiento extra a través de un checkout real en
// vez del cobro instantáneo habitual. El email del nuevo miembro se
// recoge en el propio formulario de Stripe (custom_fields), porque en
// este camino no hay ninguna pantalla previa de la app donde pedirlo.
async function activarAsientoExtra(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenant_id;
  const tipoPlan = session.metadata?.tipo_plan;
  const invitadoPor = session.metadata?.invitado_por ?? null;
  if (!tenantId || (tipoPlan !== "admin_extra" && tipoPlan !== "asesor_extra")) return;

  const campoEmail = session.custom_fields?.find((c) => c.key === "email_invitado");
  const email = campoEmail?.type === "text" ? campoEmail.text?.value?.trim().toLowerCase() : null;
  if (!email || !email.includes("@")) {
    console.error("Webhook asiento extra: email inválido o ausente en custom_fields", session.id);
    return;
  }

  const admin = createAdminClient();
  const esAdmin = tipoPlan === "admin_extra";
  const rol = esAdmin ? "admin" : "empleado";
  const campo = esAdmin ? "admins_extra" : "agentes_extra";

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);
  const customerId = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);

  const { data: tenant } = await admin
    .from("tenants")
    .select("admins_extra, agentes_extra, stripe_subscription_id")
    .eq("id", tenantId)
    .maybeSingle();
  const extraActual = (esAdmin ? tenant?.admins_extra : tenant?.agentes_extra) ?? 0;

  await admin
    .from("tenants")
    .update({
      [campo]: extraActual + 1,
      // Si el tenant no tenía suscripción de Stripe (PRO activado a
      // mano), esta pasa a ser su suscripción de referencia: los
      // próximos asientos extra ya podrán cobrarse al instante.
      ...(!tenant?.stripe_subscription_id && subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
      ...(customerId ? { stripe_customer_id: customerId } : {}),
    })
    .eq("id", tenantId);

  const { data: existente } = await admin
    .from("usuarios")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle();

  if (!existente) {
    const token = randomUUID();
    await admin.from("invitaciones").insert({
      tenant_id: tenantId,
      email,
      rol,
      token,
      invitado_por: invitadoPor,
    });
  }

  const importe = (session.amount_total ?? 0) / 100;
  await admin.from("pedidos").insert({
    tenant_id: tenantId,
    tipo: "ajuste_manual",
    concepto: esAdmin ? "Administrador adicional" : "Asesor adicional",
    importe,
    metodo_pago: "Tarjeta (Stripe)",
    estado: "pagado",
    confirmado_en: new Date().toISOString(),
    confirmado_por: "Stripe (automático)",
    stripe_checkout_session_id: session.id,
  });

  await admin.from("tenant_eventos").insert({
    tenant_id: tenantId,
    tipo: "plan",
    descripcion: `Pago confirmado por Stripe: ${esAdmin ? "administrador" : "asesor"} adicional (${importe.toFixed(2)}€). Invitación enviada a ${email}.`,
  });
}

async function cancelarPorSuscripcion(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (!tenant) return;

  await admin
    .from("tenants")
    .update({ plan_tarifa: "gratis", admins_extra: 0, agentes_extra: 0 })
    .eq("id", tenant.id);

  await admin.from("tenant_eventos").insert({
    tenant_id: tenant.id,
    tipo: "plan",
    descripcion: "Suscripción de Stripe cancelada: el plan ha vuelto a Gratis.",
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Firma de webhook de Stripe inválida:", err);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tipoPlan = session.metadata?.tipo_plan;
      if (tipoPlan === "admin_extra" || tipoPlan === "asesor_extra") {
        await activarAsientoExtra(session);
      } else {
        await activarPlanPro(session);
      }
      break;
    }
    case "customer.subscription.deleted":
      await cancelarPorSuscripcion(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
