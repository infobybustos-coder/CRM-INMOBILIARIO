"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OrigenItem = "tarea" | "evento";

function revalidarTodo() {
  revalidatePath("/asesor/tareas");
  revalidatePath("/asesor", "layout");
  revalidatePath("/asesor/agenda");
  revalidatePath("/asesor");
}

export async function alternarTareaGeneral(
  id: string,
  completada: boolean,
  origen: OrigenItem = "tarea"
) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");

  const supabase = await createClient();

  if (origen === "evento") {
    await supabase
      .from("eventos_agenda")
      .update({ estado: completada ? "completado" : "pendiente" })
      .eq("id", id)
      .eq("usuario_id", usuario.id);
  } else {
    await supabase
      .from("tareas")
      .update({
        estado: completada ? "completada" : "pendiente",
        completada_en: completada ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("asignado_a", usuario.id);
  }

  revalidarTodo();
}

export type EditarTareaState = { error: string } | { ok: true } | null;

export async function editarTareaGeneral(
  id: string,
  titulo: string,
  fechaVencimiento: string | null,
  origen: OrigenItem = "tarea"
): Promise<EditarTareaState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "Sesión expirada, vuelve a iniciar sesión." };

  const tituloLimpio = titulo.trim();
  if (!tituloLimpio) return { error: "Pon un título a la tarea." };

  const supabase = await createClient();

  if (origen === "evento") {
    if (!fechaVencimiento) return { error: "Pon una fecha." };
    const { error } = await supabase
      .from("eventos_agenda")
      .update({ titulo: tituloLimpio, fecha_hora: fechaVencimiento })
      .eq("id", id)
      .eq("usuario_id", usuario.id);
    if (error) return { error: "No se pudo guardar el evento." };
  } else {
    const { error } = await supabase
      .from("tareas")
      .update({
        titulo: tituloLimpio,
        fecha_vencimiento: fechaVencimiento || null,
      })
      .eq("id", id)
      .eq("asignado_a", usuario.id);
    if (error) return { error: "No se pudo guardar la tarea." };
  }

  revalidarTodo();
  return { ok: true };
}
