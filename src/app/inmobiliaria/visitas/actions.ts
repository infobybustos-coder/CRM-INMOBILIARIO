"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearVisita(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "No autenticado" };

  const titulo = String(formData.get("titulo") ?? "").trim();
  const entidad_tipo = String(formData.get("entidad_tipo") ?? "").trim();
  const entidad_id = String(formData.get("entidad_id") ?? "").trim() || null;
  const fecha_hora = String(formData.get("fecha_hora") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  if (!titulo || !fecha_hora) return { error: "Título y fecha son obligatorios" };

  const supabase = await createClient();
  const { error } = await supabase.from("eventos_agenda").insert({
    tenant_id: usuario.tenant_id,
    usuario_id: usuario.id,
    entidad_tipo: entidad_tipo || null,
    entidad_id,
    tipo: "visita",
    titulo,
    descripcion,
    fecha_hora,
    estado: "pendiente",
  });

  if (error) return { error: error.message };
  revalidatePath("/inmobiliaria/visitas");
  return { ok: true };
}

export async function actualizarVisita(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "No autenticado" };

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const confirmado = formData.get("confirmado");
  const resultado = String(formData.get("resultado") ?? "") || null;
  const nota_resultado = String(formData.get("nota_resultado") ?? "").trim() || null;

  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (estado) patch.estado = estado;
  if (confirmado !== null) patch.confirmado = confirmado === "true";
  if (resultado !== undefined) patch.resultado = resultado;
  if (nota_resultado !== undefined) patch.nota_resultado = nota_resultado;

  const { error } = await supabase
    .from("eventos_agenda")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: error.message };
  revalidatePath("/inmobiliaria/visitas");
  return { ok: true };
}
