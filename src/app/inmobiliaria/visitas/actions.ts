"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function crearVisita(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "No autenticado" };

  const titulo = String(formData.get("titulo") ?? "").trim();
  const entidad_tipo = String(formData.get("entidad_tipo") ?? "").trim();
  const entidad_id = String(formData.get("entidad_id") ?? "").trim() || null;
  const fecha_hora = String(formData.get("fecha_hora") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const usuario_id = String(formData.get("usuario_id") ?? "").trim() || usuario.id;

  if (!titulo || !fecha_hora) return { error: "Título y fecha son obligatorios" };

  const db = createAdminClient();
  const { error } = await db.from("eventos_agenda").insert({
    tenant_id: usuario.tenant_id,
    usuario_id,
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
  const estado = formData.get("estado") as string | null;
  const confirmado = formData.get("confirmado");
  const resultado = formData.get("resultado") as string | null;
  const nota_resultado = formData.get("nota_resultado") as string | null;

  const db = createAdminClient();
  const patch: Record<string, unknown> = {};
  if (estado) patch.estado = estado;
  if (confirmado !== null) patch.confirmado = confirmado === "true";
  if (resultado) patch.resultado = resultado;
  if (nota_resultado !== null) patch.nota_resultado = nota_resultado || null;

  const { error } = await db
    .from("eventos_agenda")
    .update(patch)
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: error.message };
  revalidatePath("/inmobiliaria/visitas");
  return { ok: true };
}

export async function cargarSelectores(tenantId: string) {
  const supabase = await createClient();
  const [{ data: inmuebles }, { data: compradores }, { data: agentes }] = await Promise.all([
    supabase.from("inmuebles").select("id, direccion").eq("tenant_id", tenantId).order("direccion"),
    supabase.from("compradores").select("id, nombre").eq("tenant_id", tenantId).order("nombre"),
    supabase.from("usuarios").select("id, nombre_completo").eq("tenant_id", tenantId).eq("activo", true),
  ]);
  return {
    inmuebles: inmuebles ?? [],
    compradores: compradores ?? [],
    agentes: agentes ?? [],
  };
}
