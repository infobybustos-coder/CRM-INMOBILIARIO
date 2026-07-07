"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidarPedidos(tenantId: string) {
  revalidatePath("/superadmin/pedidos");
  revalidatePath("/superadmin/finanzas");
  revalidatePath("/superadmin/suscripciones");
  revalidatePath("/superadmin");
  revalidatePath(`/superadmin/clientes/${tenantId}`);
}

export async function confirmarPedido(pedidoId: string) {
  const superadmin = await requireSuperadmin();
  const admin = createAdminClient();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, tenant_id, tipo, concepto, importe, estado")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido || pedido.estado !== "iniciado") return;

  await admin
    .from("pedidos")
    .update({
      estado: "pagado",
      confirmado_en: new Date().toISOString(),
      confirmado_por: superadmin.email,
    })
    .eq("id", pedidoId);

  if (pedido.tipo === "plan_pro") {
    await admin.from("tenants").update({ plan_tarifa: "pago" }).eq("id", pedido.tenant_id);
  }

  await admin.from("tenant_eventos").insert({
    tenant_id: pedido.tenant_id,
    tipo: "plan",
    descripcion: `Pago confirmado: ${pedido.concepto} (${Number(pedido.importe).toFixed(2)}€).`,
  });

  revalidarPedidos(pedido.tenant_id);
}

export async function cancelarPedido(pedidoId: string) {
  await requireSuperadmin();
  const admin = createAdminClient();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("tenant_id")
    .eq("id", pedidoId)
    .eq("estado", "iniciado")
    .maybeSingle();
  if (!pedido) return;

  await admin.from("pedidos").update({ estado: "cancelado" }).eq("id", pedidoId);
  revalidarPedidos(pedido.tenant_id);
}
