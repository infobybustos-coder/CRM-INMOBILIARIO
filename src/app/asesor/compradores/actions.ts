"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  return usuario;
}

export async function actualizarEstadoComprador(id: string, estado: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase.from("compradores").update({ estado }).eq("id", id).eq("agente_id", usuario.id);

  await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "comprador",
    entidad_id: id,
    usuario_id: usuario.id,
    tipo: "cambio_estado",
    contenido: `Cambió el estado a "${estado}"`,
  });

  revalidatePath("/asesor/compradores");
}

export type GuardarCompradorState = { error: string } | { ok: true } | null;

export async function actualizarComprador(
  id: string,
  _prevState: GuardarCompradorState,
  formData: FormData
): Promise<GuardarCompradorState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const presupuestoMin = formData.get("presupuesto_min");
  const presupuestoMax = formData.get("presupuesto_max");
  const fechaProximaAccion = formData.get("fecha_proxima_accion");
  const fechaUltimoContacto = formData.get("fecha_ultimo_contacto");
  const zonaBuscadaId = String(formData.get("zona_buscada_id") ?? "");

  const { error } = await supabase
    .from("compradores")
    .update({
      nombre,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      presupuesto_min: presupuestoMin ? Number(presupuestoMin) : null,
      presupuesto_max: presupuestoMax ? Number(presupuestoMax) : null,
      financiacion: String(formData.get("financiacion") ?? "") || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      zona_buscada_id: zonaBuscadaId || null,
      urgencia: String(formData.get("urgencia") ?? "media"),
      fecha_proxima_accion: fechaProximaAccion ? String(fechaProximaAccion) : null,
      fecha_ultimo_contacto: fechaUltimoContacto ? String(fechaUltimoContacto) : null,
      notas: String(formData.get("notas") ?? "").trim() || null,
    })
    .eq("id", id)
    .eq("agente_id", usuario.id);

  if (error) return { error: "No se pudo guardar." };

  revalidatePath(`/asesor/compradores/${id}`);
  revalidatePath("/asesor/compradores");
  return { ok: true };
}

export type NotaState = { error: string } | null;

export async function crearNota(
  compradorId: string,
  _prevState: NotaState,
  formData: FormData
): Promise<NotaState> {
  const usuario = await requireUsuario();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return { error: "Escribe algo antes de guardar." };

  const supabase = await createClient();
  const { error } = await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "comprador",
    entidad_id: compradorId,
    usuario_id: usuario.id,
    tipo: "nota",
    contenido,
  });

  if (error) return { error: "No se pudo guardar la nota." };

  revalidatePath(`/asesor/compradores/${compradorId}`);
  return null;
}

export type TareaState = { error: string } | null;

export async function crearTarea(
  compradorId: string,
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
    entidad_tipo: "comprador",
    entidad_id: compradorId,
    asignado_a: usuario.id,
    titulo,
    fecha_vencimiento: fechaVencimiento ? String(fechaVencimiento) : null,
  });

  if (error) return { error: "No se pudo crear la tarea." };

  revalidatePath(`/asesor/compradores/${compradorId}`);
  return null;
}

export async function alternarTarea(tareaId: string, compradorId: string, completada: boolean) {
  await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("tareas")
    .update({
      estado: completada ? "completada" : "pendiente",
      completada_en: completada ? new Date().toISOString() : null,
    })
    .eq("id", tareaId);

  revalidatePath(`/asesor/compradores/${compradorId}`);
}

export type ZonaState = { error: string } | { ok: true; zona: { id: string; nombre: string; ciudad: string | null } } | null;

export async function crearZona(
  _prevState: ZonaState,
  formData: FormData
): Promise<ZonaState> {
  const usuario = await requireUsuario();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Ponle un nombre a la zona." };

  const ciudad = String(formData.get("ciudad") ?? "").trim() || null;
  const provincia = String(formData.get("provincia_estado") ?? "").trim() || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zonas")
    .insert({ tenant_id: usuario.tenant_id, nombre, ciudad, provincia_estado: provincia })
    .select("id, nombre, ciudad")
    .single();

  if (error || !data) return { error: "No se pudo crear la zona." };

  return { ok: true, zona: data };
}
