"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OrigenItem = "tarea" | "evento";

function revalidarTodo() {
  revalidatePath("/asesor/agenda");
  revalidatePath("/asesor/tareas");
  revalidatePath("/asesor", "layout");
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

  revalidarTodo();
  return { ok: true };
}

export async function cancelarTareaGeneral(id: string, origen: OrigenItem = "tarea") {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");

  const supabase = await createClient();

  if (origen === "evento") {
    await supabase
      .from("eventos_agenda")
      .update({ estado: "cancelado" })
      .eq("id", id)
      .eq("usuario_id", usuario.id);
  } else {
    await supabase
      .from("tareas")
      .update({ estado: "cancelada" })
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
