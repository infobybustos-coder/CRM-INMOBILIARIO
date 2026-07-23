"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site-url";
import { enviarCorreo } from "@/lib/correos/enviar";

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
    const { data: tenantAntes } = await admin
      .from("tenants")
      .select("nombre, tipo_plan, plan_tarifa")
      .eq("id", pedido.tenant_id)
      .maybeSingle();

    await admin.from("tenants").update({ plan_tarifa: "pago" }).eq("id", pedido.tenant_id);

    if (tenantAntes && tenantAntes.plan_tarifa !== "pago") {
      const { data: contacto } = await admin
        .from("usuarios")
        .select("nombre_completo, email")
        .eq("tenant_id", pedido.tenant_id)
        .order("rol", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (contacto) {
        await enviarCorreo("cambio_plan", contacto.email, {
          nombre: contacto.nombre_completo ?? "",
          empresa: tenantAntes.nombre,
          plan: `Plan ${tenantAntes.tipo_plan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} PRO`,
          app_url: await siteUrl(),
        });
      }
    }
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

// Borra el registro por completo (a diferencia de cancelar, que solo
// cambia el estado). Pensado para limpiar pedidos de prueba: no revierte
// nada del plan del tenant, solo elimina el registro del pedido.
export async function eliminarPedido(pedidoId: string) {
  const superadmin = await requireSuperadmin();
  const admin = createAdminClient();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("tenant_id, concepto")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) return;

  await admin.from("pedidos").delete().eq("id", pedidoId);

  await admin.from("superadmin_auditoria").insert({
    accion: "eliminar_pedido",
    detalle: `Pedido "${pedido.concepto}" (${pedidoId}) eliminado.`,
    actor_email: superadmin.email,
  });

  revalidarPedidos(pedido.tenant_id);
}
