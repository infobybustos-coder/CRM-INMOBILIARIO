"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoTenant = "activo" | "suspendido" | "cancelado";

const ETIQUETA_ESTADO: Record<EstadoTenant, string> = {
  activo: "Activo",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
};

function revalidarCliente(tenantId: string) {
  revalidatePath(`/superadmin/clientes/${tenantId}`);
  revalidatePath("/superadmin/clientes");
  revalidatePath("/superadmin/suscripciones");
  revalidatePath("/superadmin");
}

export async function cambiarEstadoTenant(tenantId: string, nuevoEstado: EstadoTenant) {
  await requireSuperadmin();

  const admin = createAdminClient();
  await admin.from("tenants").update({ estado: nuevoEstado }).eq("id", tenantId);
  await admin.from("tenant_eventos").insert({
    tenant_id: tenantId,
    tipo: "estado",
    descripcion: `Estado cambiado a ${ETIQUETA_ESTADO[nuevoEstado]}.`,
  });

  revalidarCliente(tenantId);
}

export async function cambiarPlanTenant(
  tenantId: string,
  tipoPlan: "asesor" | "inmobiliaria",
  planTarifa: "gratis" | "pago"
) {
  await requireSuperadmin();

  const admin = createAdminClient();
  await admin.from("tenants").update({ tipo_plan: tipoPlan, plan_tarifa: planTarifa }).eq("id", tenantId);
  await admin.from("tenant_eventos").insert({
    tenant_id: tenantId,
    tipo: "plan",
    descripcion: `Plan cambiado a ${tipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} ${
      planTarifa === "pago" ? "PRO" : "Gratis"
    } (manual, por soporte).`,
  });

  revalidarCliente(tenantId);
}

export async function ajustarAsientosTenant(tenantId: string, campo: "admins_extra" | "agentes_extra", delta: number) {
  await requireSuperadmin();

  const admin = createAdminClient();
  const { data: tenant } = await admin.from("tenants").select(campo).eq("id", tenantId).maybeSingle();
  if (!tenant) return;

  const actual = (tenant as unknown as Record<string, number>)[campo] ?? 0;
  const nuevo = Math.max(0, actual + delta);
  await admin.from("tenants").update({ [campo]: nuevo }).eq("id", tenantId);
  await admin.from("tenant_eventos").insert({
    tenant_id: tenantId,
    tipo: "plan",
    descripcion: `${campo === "admins_extra" ? "Administradores" : "Asesores"} extra ajustado a ${nuevo} (manual, por soporte).`,
  });

  revalidarCliente(tenantId);
}

export async function editarEmpresa(tenantId: string, nombre: string, pais: string) {
  await requireSuperadmin();

  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return;

  const admin = createAdminClient();
  await admin.from("tenants").update({ nombre: nombreLimpio, pais }).eq("id", tenantId);

  revalidarCliente(tenantId);
}

export async function agregarNota(tenantId: string, texto: string) {
  const superadmin = await requireSuperadmin();

  const textoLimpio = texto.trim();
  if (!textoLimpio) return;

  const admin = createAdminClient();
  await admin.from("tenant_notas").insert({
    tenant_id: tenantId,
    texto: textoLimpio,
    creado_por: superadmin.email,
  });

  revalidarCliente(tenantId);
}

export async function eliminarTenant(tenantId: string, confirmacionNombre: string) {
  const superadmin = await requireSuperadmin();

  const admin = createAdminClient();
  const { data: tenant } = await admin.from("tenants").select("nombre").eq("id", tenantId).maybeSingle();
  if (!tenant || tenant.nombre !== confirmacionNombre) return;

  await admin.from("superadmin_auditoria").insert({
    accion: "eliminar_tenant",
    detalle: `Tenant "${tenant.nombre}" (${tenantId}) eliminado.`,
    actor_email: superadmin.email,
  });

  await admin.from("tenants").delete().eq("id", tenantId);

  revalidatePath("/superadmin/clientes");
  revalidatePath("/superadmin");
  redirect("/superadmin/clientes");
}
