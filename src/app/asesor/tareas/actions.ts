"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CrearTareaState = { error: string } | { ok: true } | null;

export async function crearTareaGeneral(
  _prevState: CrearTareaState,
  formData: FormData
): Promise<CrearTareaState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "Sesión expirada, vuelve a iniciar sesión." };

  const titulo = String(formData.get("titulo") ?? "").trim();
  const fechaVencimiento = String(formData.get("fecha_vencimiento") ?? "").trim();

  if (!titulo) return { error: "Pon un título a la tarea." };

  const supabase = await createClient();
  const { error } = await supabase.from("tareas").insert({
    tenant_id: usuario.tenant_id,
    asignado_a: usuario.id,
    titulo,
    fecha_vencimiento: fechaVencimiento || null,
  });

  if (error) return { error: "No se pudo crear la tarea." };

  revalidatePath("/asesor/seguimiento");
  revalidatePath("/asesor", "layout");
  return { ok: true };
}

function revalidarSeguimiento(id?: string) {
  revalidatePath("/asesor/seguimiento");
  if (id) revalidatePath(`/asesor/seguimiento/${id}`);
  revalidatePath("/asesor", "layout");
}

export async function completarTarea(id: string) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  const supabase = await createClient();

  await supabase
    .from("tareas")
    .update({ estado: "completada", completada_en: new Date().toISOString() })
    .eq("id", id)
    .eq("asignado_a", usuario.id);

  revalidarSeguimiento(id);
}

export async function reprogramarTarea(id: string, nuevaFecha: string) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  const supabase = await createClient();

  await supabase
    .from("tareas")
    .update({ fecha_vencimiento: nuevaFecha })
    .eq("id", id)
    .eq("asignado_a", usuario.id);

  revalidarSeguimiento(id);
}

export async function eliminarTarea(id: string) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  const supabase = await createClient();

  await supabase.from("tareas").delete().eq("id", id).eq("asignado_a", usuario.id);

  revalidarSeguimiento();
}
