"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  return usuario;
}

export async function actualizarEstadoPropietario(id: string, estado: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("propietarios")
    .update({ estado })
    .eq("id", id)
    .eq("agente_id", usuario.id);

  await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: id,
    usuario_id: usuario.id,
    tipo: "cambio_estado",
    contenido: `Cambió el estado a "${estado}"`,
  });

  revalidatePath("/asesor/propietarios");
}

export type GuardarPropietarioState = { error: string } | { ok: true } | null;

export async function actualizarPropietario(
  id: string,
  _prevState: GuardarPropietarioState,
  formData: FormData
): Promise<GuardarPropietarioState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  if (!nombre || !telefono) {
    return { error: "El nombre y el teléfono son obligatorios." };
  }

  const valorEstimado = formData.get("valor_estimado");
  const fechaProximaAccion = formData.get("fecha_proxima_accion");
  const fechaUltimoContacto = formData.get("fecha_ultimo_contacto");

  const { error } = await supabase
    .from("propietarios")
    .update({
      nombre,
      telefono,
      email: String(formData.get("email") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      direccion: String(formData.get("direccion") ?? "").trim() || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      fecha_proxima_accion: fechaProximaAccion ? String(fechaProximaAccion) : null,
      fecha_ultimo_contacto: fechaUltimoContacto ? String(fechaUltimoContacto) : null,
      notas: String(formData.get("notas") ?? "").trim() || null,
    })
    .eq("id", id)
    .eq("agente_id", usuario.id);

  if (error) return { error: "No se pudo guardar." };

  revalidatePath(`/asesor/propietarios/${id}`);
  revalidatePath("/asesor/propietarios");
  return { ok: true };
}

export type NotaState = { error: string } | null;

export async function crearNota(
  propietarioId: string,
  _prevState: NotaState,
  formData: FormData
): Promise<NotaState> {
  const usuario = await requireUsuario();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return { error: "Escribe algo antes de guardar." };

  const supabase = await createClient();
  const { error } = await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: propietarioId,
    usuario_id: usuario.id,
    tipo: "nota",
    contenido,
  });

  if (error) return { error: "No se pudo guardar la nota." };

  revalidatePath(`/asesor/propietarios/${propietarioId}`);
  return null;
}

export type TareaState = { error: string } | null;

export async function crearTarea(
  propietarioId: string,
  _prevState: TareaState,
  formData: FormData
): Promise<TareaState> {
  const usuario = await requireUsuario();
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Pon un título a la tarea." };

  const fechaVencimiento = formData.get("fecha_vencimiento");

  const supabase = await createClient();
  const { error } = await supabase.from("tareas").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: propietarioId,
    asignado_a: usuario.id,
    titulo,
    fecha_vencimiento: fechaVencimiento ? String(fechaVencimiento) : null,
  });

  if (error) return { error: "No se pudo crear la tarea." };

  revalidatePath(`/asesor/propietarios/${propietarioId}`);
  return null;
}

export async function alternarTarea(
  tareaId: string,
  propietarioId: string,
  completada: boolean
) {
  await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("tareas")
    .update({
      estado: completada ? "completada" : "pendiente",
      completada_en: completada ? new Date().toISOString() : null,
    })
    .eq("id", tareaId);

  revalidatePath(`/asesor/propietarios/${propietarioId}`);
}

export async function registrarDocumento(
  propietarioId: string,
  nombreArchivo: string,
  urlStorage: string,
  tipoDocumento: string | null
) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const { error } = await supabase.from("documentos").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: propietarioId,
    tipo_documento: tipoDocumento,
    nombre_archivo: nombreArchivo,
    url_storage: urlStorage,
    subido_por: usuario.id,
  });

  if (error) throw new Error("No se pudo registrar el documento");

  revalidatePath(`/asesor/propietarios/${propietarioId}`);
}

export async function eliminarDocumento(documentoId: string, propietarioId: string, urlStorage: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase.storage.from("documentos").remove([urlStorage]);
  await supabase.from("documentos").delete().eq("id", documentoId).eq("tenant_id", usuario.tenant_id);

  revalidatePath(`/asesor/propietarios/${propietarioId}`);
}
