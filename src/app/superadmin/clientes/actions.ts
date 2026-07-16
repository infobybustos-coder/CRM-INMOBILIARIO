"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { precioPlan } from "@/lib/planes";
import { METODOS_PAGO } from "@/lib/metodos-pago";
import { siteUrl } from "@/lib/site-url";
import { enviarCorreo, enviarCorreoRecuperacion } from "@/lib/correos/enviar";

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

async function contactoTenant(admin: ReturnType<typeof createAdminClient>, tenantId: string) {
  const { data } = await admin
    .from("usuarios")
    .select("nombre_completo, email")
    .eq("tenant_id", tenantId)
    .order("rol", { ascending: true }) // "admin" antes que "empleado"
    .limit(1)
    .maybeSingle();
  return data;
}

export async function cambiarEstadoTenant(tenantId: string, nuevoEstado: EstadoTenant) {
  await requireSuperadmin();

  const admin = createAdminClient();
  const { data: tenant } = await admin.from("tenants").select("nombre").eq("id", tenantId).maybeSingle();

  await admin.from("tenants").update({ estado: nuevoEstado }).eq("id", tenantId);
  await admin.from("tenant_eventos").insert({
    tenant_id: tenantId,
    tipo: "estado",
    descripcion: `Estado cambiado a ${ETIQUETA_ESTADO[nuevoEstado]}.`,
  });

  if (nuevoEstado === "cancelado") {
    const contacto = await contactoTenant(admin, tenantId);
    if (contacto) {
      await enviarCorreo("cancelacion_plan", contacto.email, {
        nombre: contacto.nombre_completo ?? "",
        empresa: tenant?.nombre ?? "",
        fecha: new Date().toLocaleDateString("es-ES"),
      });
    }
  }

  revalidarCliente(tenantId);
}

export async function cambiarPlanTenant(
  tenantId: string,
  tipoPlan: "asesor" | "inmobiliaria",
  planTarifa: "gratis" | "pago",
  metodoPago?: string
) {
  const superadmin = await requireSuperadmin();

  const admin = createAdminClient();
  const { data: tenantAntes } = await admin
    .from("tenants")
    .select("nombre, plan_tarifa")
    .eq("id", tenantId)
    .maybeSingle();

  await admin.from("tenants").update({ tipo_plan: tipoPlan, plan_tarifa: planTarifa }).eq("id", tenantId);
  await admin.from("tenant_eventos").insert({
    tenant_id: tenantId,
    tipo: "plan",
    descripcion: `Plan cambiado a ${tipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} ${
      planTarifa === "pago" ? "PRO" : "Gratis"
    } (manual, por soporte).`,
  });

  if (planTarifa === "pago" && tenantAntes?.plan_tarifa !== "pago") {
    const contacto = await contactoTenant(admin, tenantId);
    if (contacto) {
      await enviarCorreo("cambio_plan", contacto.email, {
        nombre: contacto.nombre_completo ?? "",
        empresa: tenantAntes?.nombre ?? "",
        plan: `Plan ${tipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} PRO`,
        app_url: await siteUrl(),
      });
    }
  }

  if (planTarifa === "pago" && metodoPago && METODOS_PAGO.includes(metodoPago as (typeof METODOS_PAGO)[number])) {
    const config = await obtenerConfigPlanes();
    await admin.from("pedidos").insert({
      tenant_id: tenantId,
      tipo: "ajuste_manual",
      concepto: `Cambio a ${tipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} PRO (manual)`,
      importe: precioPlan(config, { tipo_plan: tipoPlan, plan_tarifa: planTarifa }),
      moneda: "EUR",
      metodo_pago: metodoPago,
      estado: "pagado",
      confirmado_en: new Date().toISOString(),
      confirmado_por: superadmin.email,
    });
  }

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

export async function restablecerContrasenaUsuario(usuarioId: string, tenantId: string) {
  const superadmin = await requireSuperadmin();

  const admin = createAdminClient();
  const { data: usuario } = await admin
    .from("usuarios")
    .select("email, nombre_completo")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!usuario) return { error: "No se encontró el usuario." };

  const resultado = await enviarCorreoRecuperacion(usuario.email, usuario.nombre_completo);
  if ("error" in resultado) return { error: "No se pudo enviar el correo de restablecimiento." };

  await admin.from("tenant_eventos").insert({
    tenant_id: tenantId,
    tipo: "soporte",
    descripcion: `Restablecimiento de contraseña enviado a ${usuario.nombre_completo ?? usuario.email} (por soporte).`,
  });
  await admin.from("superadmin_auditoria").insert({
    accion: "restablecer_password",
    detalle: `Correo de restablecimiento enviado a ${usuario.email} (usuario ${usuarioId}).`,
    actor_email: superadmin.email,
  });

  revalidarCliente(tenantId);
  return { ok: true } as const;
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
