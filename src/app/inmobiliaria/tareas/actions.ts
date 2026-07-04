"use server";

import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function revalidarTareas(id?: string) {
  revalidatePath("/inmobiliaria/tareas");
  if (id) revalidatePath(`/inmobiliaria/tareas/${id}`);
  revalidatePath("/inmobiliaria/seguimiento");
  revalidatePath("/inmobiliaria");
}

export async function completarTarea(id: string) {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();

  await supabase
    .from("tareas")
    .update({ estado: "completada", completada_en: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "tarea",
    entidad_id: id,
    usuario_id: usuario.id,
    tipo: "sistema",
    contenido: "Marcada como completada.",
  });

  revalidarTareas(id);
}

export async function reprogramarTarea(id: string, nuevaFecha: string) {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();

  await supabase
    .from("tareas")
    .update({ fecha_vencimiento: nuevaFecha })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "tarea",
    entidad_id: id,
    usuario_id: usuario.id,
    tipo: "sistema",
    contenido: "Fecha límite cambiada.",
  });

  revalidarTareas(id);
}

export async function eliminarTarea(id: string) {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();

  await supabase.from("tareas").delete().eq("id", id).eq("tenant_id", usuario.tenant_id);

  revalidarTareas();
}

export type ActualizarTareaState = { error: string } | { ok: true } | null;

export async function actualizarTarea(
  id: string,
  _prevState: ActualizarTareaState,
  formData: FormData
): Promise<ActualizarTareaState> {
  const usuario = await requireAdminInmobiliaria();

  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Pon un título a la tarea." };

  const asignado_a = String(formData.get("asignado_a") ?? "").trim() || null;
  const fecha_vencimiento = String(formData.get("fecha_vencimiento") ?? "").trim() || null;
  const prioridad = String(formData.get("prioridad") ?? "media");
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("tareas")
    .update({ titulo, asignado_a, fecha_vencimiento, prioridad, descripcion })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: "No se pudo guardar la tarea." };

  revalidarTareas(id);
  return { ok: true };
}

export type ComentarioState = { error: string } | null;

export async function crearComentarioTarea(
  tareaId: string,
  _prevState: ComentarioState,
  formData: FormData
): Promise<ComentarioState> {
  const usuario = await requireAdminInmobiliaria();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return null;

  const supabase = await createClient();
  const { error } = await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "tarea",
    entidad_id: tareaId,
    usuario_id: usuario.id,
    tipo: "nota",
    contenido,
  });

  if (error) return { error: "No se pudo guardar el comentario." };

  revalidarTareas(tareaId);
  return null;
}
