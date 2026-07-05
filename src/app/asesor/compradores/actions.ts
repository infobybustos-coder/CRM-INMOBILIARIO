"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioEfectivo, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { limiteRecurso } from "@/lib/planes";

async function requireUsuario() {
  const usuario = await getUsuarioEfectivo();
  if (!usuario) throw new Error("No autenticado");
  return usuario;
}

// Este módulo lo usan tanto /asesor/compradores como /inmobiliaria/compradores.
const BASES_COMPRADORES = ["/asesor/compradores", "/inmobiliaria/compradores"];

function revalidarComprador(id?: string) {
  for (const base of BASES_COMPRADORES) {
    revalidatePath(base);
    if (id) revalidatePath(`${base}/${id}`);
  }
}

function revalidarAgendaYPanel() {
  revalidatePath("/asesor", "layout");
  revalidatePath("/asesor/agenda");
  revalidatePath("/inmobiliaria");
  revalidatePath("/inmobiliaria/agenda");
}

export async function actualizarEstadoComprador(id: string, estado: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("compradores")
    .update({ estado })
    .eq("id", id)
    .eq(
      esGestor(usuario.rol) ? "tenant_id" : "agente_id",
      esGestor(usuario.rol) ? usuario.tenant_id : usuario.id
    );

  await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "comprador",
    entidad_id: id,
    usuario_id: usuario.id,
    tipo: "cambio_estado",
    contenido: `Cambió el estado a "${estado}"`,
  });

  revalidarComprador();
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

  const gestor = esGestor(usuario.rol);
  const nuevoAgenteId = gestor ? String(formData.get("agente_id") ?? "").trim() || null : null;
  const presupuestoMin = formData.get("presupuesto_min");
  const presupuestoMax = formData.get("presupuesto_max");
  const fechaProximaAccion = formData.get("fecha_proxima_accion");
  const fechaUltimoContacto = formData.get("fecha_ultimo_contacto");
  const zonaBuscadaId = String(formData.get("zona_buscada_id") ?? "");
  const habitaciones = formData.get("habitaciones");

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
      habitaciones: habitaciones ? Number(habitaciones) : null,
      urgencia: String(formData.get("urgencia") ?? "media"),
      fecha_proxima_accion: fechaProximaAccion ? String(fechaProximaAccion) : null,
      fecha_ultimo_contacto: fechaUltimoContacto ? String(fechaUltimoContacto) : null,
      notas: String(formData.get("notas") ?? "").trim() || null,
      ...(nuevoAgenteId ? { agente_id: nuevoAgenteId } : {}),
    })
    .eq("id", id)
    .eq(
      gestor ? "tenant_id" : "agente_id",
      gestor ? usuario.tenant_id : usuario.id
    );

  if (error) return { error: "No se pudo guardar." };

  revalidarComprador(id);
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

  revalidarComprador(compradorId);
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

  revalidarComprador(compradorId);
  revalidarAgendaYPanel();
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

  revalidarComprador(compradorId);
  revalidarAgendaYPanel();
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

export type CrearCompradorRapidoState = { error: string; limite?: true } | { ok: true } | null;

export async function crearCompradorRapido(
  _prevState: CrearCompradorRapidoState,
  formData: FormData
): Promise<CrearCompradorRapidoState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();

  if (!nombre || !telefono) {
    return { error: "Pon al menos el nombre y el teléfono." };
  }

  const limite = limiteRecurso(usuario.tenant ?? {}, "compradores");
  if (limite !== null) {
    const { count } = await supabase
      .from("compradores")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id);
    if ((count ?? 0) >= limite) {
      return {
        error: `Has llegado al límite de ${limite} compradores del plan Gratis.`,
        limite: true,
      };
    }
  }

  const { error } = await supabase.from("compradores").insert({
    tenant_id: usuario.tenant_id,
    agente_id: usuario.id,
    nombre,
    telefono,
  });

  if (error) return { error: "No se pudo guardar el comprador." };

  revalidarComprador();
  return { ok: true };
}

export async function registrarDocumento(
  compradorId: string,
  nombreArchivo: string,
  urlStorage: string,
  tipoDocumento: string | null
) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const { error } = await supabase.from("documentos").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "comprador",
    entidad_id: compradorId,
    tipo_documento: tipoDocumento,
    nombre_archivo: nombreArchivo,
    url_storage: urlStorage,
    subido_por: usuario.id,
  });

  if (error) throw new Error("No se pudo registrar el documento");

  revalidarComprador(compradorId);
}

export async function eliminarDocumento(documentoId: string, compradorId: string, urlStorage: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase.storage.from("documentos").remove([urlStorage]);
  await supabase.from("documentos").delete().eq("id", documentoId).eq("tenant_id", usuario.tenant_id);

  revalidarComprador(compradorId);
}

export async function eliminarComprador(id: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();
  const gestor = esGestor(usuario.rol);

  await supabase
    .from("compradores")
    .delete()
    .eq("id", id)
    .eq(gestor ? "tenant_id" : "agente_id", gestor ? usuario.tenant_id : usuario.id);

  revalidarComprador();
}
