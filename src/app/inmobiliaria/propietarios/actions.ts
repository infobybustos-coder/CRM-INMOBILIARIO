"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  return usuario;
}

export type CrearPropietarioState = { error: string } | { ok: true } | null;

export async function crearPropietario(
  _prevState: CrearPropietarioState,
  formData: FormData
): Promise<CrearPropietarioState> {
  const usuario = await requireUsuario();
  const db = createAdminClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const valorEstimado = formData.get("valor_estimado");
  const gestor = esGestor(usuario.rol);
  const agenteId = gestor && formData.get("agente_id") ? String(formData.get("agente_id")) : usuario.id;

  const { data, error } = await db
    .from("propietarios")
    .insert({
      tenant_id: usuario.tenant_id,
      agente_id: agenteId,
      nombre,
      telefono: telefono || null,
      direccion: String(formData.get("direccion") ?? "").trim() || null,
      estado: "nuevo_lead",
      notas: String(formData.get("notas") ?? "").trim() || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la captación." };

  revalidatePath("/inmobiliaria/propietarios");
  redirect(`/inmobiliaria/propietarios/${data.id}`);
}

export type ActualizarPropietarioState = { error: string } | { ok: true } | null;

export async function actualizarPropietarioInmobiliaria(
  id: string,
  _prevState: ActualizarPropietarioState,
  formData: FormData
): Promise<ActualizarPropietarioState> {
  const usuario = await requireUsuario();
  const db = createAdminClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const valorEstimado = formData.get("valor_estimado");
  const fechaProximaAccion = formData.get("fecha_proxima_accion");
  const fechaUltimoContacto = formData.get("fecha_ultimo_contacto");
  const gestor = esGestor(usuario.rol);

  const { error } = await db
    .from("propietarios")
    .update({
      nombre,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      direccion: String(formData.get("direccion") ?? "").trim() || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      fuente_lead: String(formData.get("fuente_lead") ?? "") || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      fecha_proxima_accion: fechaProximaAccion ? String(fechaProximaAccion) : null,
      fecha_ultimo_contacto: fechaUltimoContacto ? String(fechaUltimoContacto) : null,
      notas: String(formData.get("notas") ?? "").trim() || null,
      ...(gestor && formData.get("agente_id") ? { agente_id: String(formData.get("agente_id")) } : {}),
    })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: `Error al guardar: ${error.message}` };

  revalidatePath(`/inmobiliaria/propietarios/${id}`);
  revalidatePath("/inmobiliaria/propietarios");
  return { ok: true };
}

export async function cargarDocumentosPropietario(id: string) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("documentos")
    .select("id, tipo_documento, nombre_archivo, url_storage, creado_en")
    .eq("entidad_tipo", "propietario")
    .eq("entidad_id", id)
    .order("creado_en", { ascending: false });
  return data ?? [];
}

export async function cargarPropietarioPanel(id: string) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return null;
  const supabase = await createClient();
  const [{ data: propietario }, { data: documentos }] = await Promise.all([
    supabase
      .from("propietarios")
      .select(
        "id, nombre, telefono, email, whatsapp, direccion, tipo_inmueble, estado, valor_estimado, fecha_ultimo_contacto, fecha_proxima_accion, fuente_lead, notas, agente_id"
      )
      .eq("id", id)
      .eq("tenant_id", usuario.tenant_id)
      .single(),
    supabase
      .from("documentos")
      .select("id, tipo_documento, nombre_archivo, url_storage, creado_en")
      .eq("entidad_tipo", "propietario")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
  ]);
  return {
    propietario,
    documentos: documentos ?? [],
    tenantId: usuario.tenant_id,
  };
}

export async function actualizarEstadoPropietarioInmobiliaria(id: string, estado: string) {
  const usuario = await requireUsuario();
  const db = createAdminClient();

  const { error } = await db
    .from("propietarios")
    .update({ estado })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (!error) {
    await db.from("actividades").insert({
      tenant_id: usuario.tenant_id,
      entidad_tipo: "propietario",
      entidad_id: id,
      usuario_id: usuario.id,
      tipo: "cambio_estado",
      contenido: `Estado actualizado a: ${estado}`,
    });
  }

  revalidatePath("/inmobiliaria/propietarios");
}

export type NotaState = { error: string } | null;

export async function crearNotaPropietario(
  propietarioId: string,
  _prevState: NotaState,
  formData: FormData
): Promise<NotaState> {
  const usuario = await requireUsuario();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return { error: "Escribe algo antes de guardar." };

  const db = createAdminClient();
  const { error } = await db.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: propietarioId,
    usuario_id: usuario.id,
    tipo: "nota",
    contenido,
  });

  if (error) return { error: "No se pudo guardar la nota." };

  revalidatePath(`/inmobiliaria/propietarios/${propietarioId}`);
  return null;
}

export type TareaState = { error: string } | null;

export async function crearTareaPropietario(
  propietarioId: string,
  _prevState: TareaState,
  formData: FormData
): Promise<TareaState> {
  const usuario = await requireUsuario();
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Pon un título a la tarea." };

  const fechaVencimiento = formData.get("fecha_vencimiento");
  const db = createAdminClient();
  const { error } = await db.from("tareas").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: propietarioId,
    asignado_a: usuario.id,
    titulo,
    fecha_vencimiento: fechaVencimiento ? String(fechaVencimiento) : null,
  });

  if (error) return { error: "No se pudo crear la tarea." };

  revalidatePath(`/inmobiliaria/propietarios/${propietarioId}`);
  return null;
}

export async function alternarTareaPropietario(
  tareaId: string,
  propietarioId: string,
  completada: boolean
) {
  await requireUsuario();
  const db = createAdminClient();

  await db
    .from("tareas")
    .update({
      estado: completada ? "completada" : "pendiente",
      completada_en: completada ? new Date().toISOString() : null,
    })
    .eq("id", tareaId);

  revalidatePath(`/inmobiliaria/propietarios/${propietarioId}`);
}
