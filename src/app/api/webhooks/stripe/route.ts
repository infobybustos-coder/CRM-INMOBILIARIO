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
    case "checkout.session.completed":
      await activarPlanPro(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.deleted":
      await cancelarPorSuscripcion(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
