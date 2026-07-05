"use server";

import { revalidatePath } from "next/cache";
import { requireInmobiliaria, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function revalidarAgenda(id?: string) {
  revalidatePath("/inmobiliaria/agenda");
  if (id) revalidatePath(`/inmobiliaria/agenda/${id}`);
  revalidatePath("/inmobiliaria/seguimiento");
  revalidatePath("/inmobiliaria/mi-agenda");
  revalidatePath("/inmobiliaria");
  revalidatePath("/inmobiliaria/visitas");
  revalidatePath("/inmobiliaria/mis-visitas");
}

export async function marcarRealizada(id: string) {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  let query = supabase
    .from("eventos_agenda")
    .update({ estado: "completado" })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);
  if (!esGestor(usuario.rol)) query = query.eq("usuario_id", usuario.id);
  await query;

  revalidarAgenda(id);
}

export async function cancelarEvento(id: string) {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  let query = supabase
    .from("eventos_agenda")
    .update({ estado: "cancelado" })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);
  if (!esGestor(usuario.rol)) query = query.eq("usuario_id", usuario.id);
  await query;

  revalidarAgenda(id);
}

export async function confirmarEvento(id: string, confirmado: boolean) {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  let query = supabase
    .from("eventos_agenda")
    .update({ confirmado })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);
  if (!esGestor(usuario.rol)) query = query.eq("usuario_id", usuario.id);
  await query;

  revalidarAgenda(id);
}

export async function reprogramarEvento(id: string, nuevaFechaHora: string) {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  let query = supabase
    .from("eventos_agenda")
    .update({ fecha_hora: nuevaFechaHora, estado: "pendiente" })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);
  if (!esGestor(usuario.rol)) query = query.eq("usuario_id", usuario.id);
  await query;

  revalidarAgenda(id);
}

export type ResultadoState = { error: string } | { ok: true } | null;

export async function actualizarResultado(
  id: string,
  _prevState: ResultadoState,
  formData: FormData
): Promise<ResultadoState> {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  const nota_resultado = String(formData.get("resultado") ?? "").trim() || null;
  const descripcion = String(formData.get("notas") ?? "").trim() || null;

  let query = supabase
    .from("eventos_agenda")
    .update({ nota_resultado, descripcion })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);
  if (!esGestor(usuario.rol)) query = query.eq("usuario_id", usuario.id);
  const { error } = await query;

  if (error) return { error: "No se pudo guardar." };

  revalidarAgenda(id);
  return { ok: true };
}
