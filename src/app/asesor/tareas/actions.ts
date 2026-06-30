"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function revalidarTodo() {
  revalidatePath("/asesor/tareas");
  revalidatePath("/asesor", "layout");
  revalidatePath("/asesor/agenda");
}

export async function alternarTareaGeneral(tareaId: string, completada: boolean) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");

  const supabase = await createClient();
  await supabase
    .from("tareas")
    .update({
      estado: completada ? "completada" : "pendiente",
      completada_en: completada ? new Date().toISOString() : null,
    })
    .eq("id", tareaId)
    .eq("asignado_a", usuario.id);

  revalidarTodo();
}

export type EditarTareaState = { error: string } | { ok: true } | null;

export async function editarTareaGeneral(
  tareaId: string,
  titulo: string,
  fechaVencimiento: string | null
): Promise<EditarTareaState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "Sesión expirada, vuelve a iniciar sesión." };

  const tituloLimpio = titulo.trim();
  if (!tituloLimpio) return { error: "Pon un título a la tarea." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tareas")
    .update({
      titulo: tituloLimpio,
      fecha_vencimiento: fechaVencimiento || null,
    })
    .eq("id", tareaId)
    .eq("asignado_a", usuario.id);

  if (error) return { error: "No se pudo guardar la tarea." };

  revalidarTodo();
  return { ok: true };
}
