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

// Este módulo lo usan tanto /asesor/propietarios como /inmobiliaria/propietarios
// (el panel de equipo), así que hay que revalidar las dos rutas.
const BASES_PROPIETARIOS = ["/asesor/propietarios", "/inmobiliaria/propietarios"];

function revalidarPropietario(id?: string) {
  for (const base of BASES_PROPIETARIOS) {
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

export async function actualizarEstadoPropietario(id: string, estado: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("propietarios")
    .update({ estado })
    .eq("id", id)
    .eq(
      esGestor(usuario.rol) ? "tenant_id" : "agente_id",
      esGestor(usuario.rol) ? usuario.tenant_id : usuario.id
    );

  await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: id,
    usuario_id: usuario.id,
    tipo: "cambio_estado",
    contenido: `Cambió el estado a "${estado}"`,
  });

  revalidarPropietario();
}

export type GuardarPropietarioState = { error: string } | { ok: true } | null;

export async function actualizarPropietario(
  id: string,
  _prevState: GuardarPropietarioState,
  formData: FormData
): Promise<GuardarPropietarioState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  if (!nombre || !telefono) {
    return { error: "El nombre y el teléfono son obligatorios." };
  }

  const valorEstimado = formData.get("valor_estimado");
  const fechaProximaAccion = formData.get("fecha_proxima_accion");
  const fechaUltimoContacto = formData.get("fecha_ultimo_contacto");

  const gestor = esGestor(usuario.rol);
  const nuevoAgenteId = gestor ? String(formData.get("agente_id") ?? "").trim() || null : null;

  const { error } = await supabase
    .from("propietarios")
    .update({
      nombre,
      telefono,
      email: String(formData.get("email") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      direccion: String(formData.get("direccion") ?? "").trim() || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      fuente_lead: String(formData.get("fuente_lead") ?? "") || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
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

  revalidarPropietario(id);
  return { ok: true };
}

export type NotaState = { error: string } | null;

export async function crearNota(
  propietarioId: string,
  _prevState: NotaState,
  formData: FormData
): Promise<NotaState> {
  const usuario = await requireUsuario();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return { error: "Escribe algo antes de guardar." };

  const supabase = await createClient();
  const { error } = await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: propietarioId,
    usuario_id: usuario.id,
    tipo: "nota",
    contenido,
  });

  if (error) return { error: "No se pudo guardar la nota." };

  revalidarPropietario(propietarioId);
  return null;
}

export type TareaState = { error: string } | null;

export async function crearTarea(
  propietarioId: string,
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
    entidad_tipo: "propietario",
    entidad_id: propietarioId,
    asignado_a: usuario.id,
    titulo,
    fecha_vencimiento: fechaVencimiento ? String(fechaVencimiento) : null,
  });

  if (error) return { error: "No se pudo crear la tarea." };

  revalidarPropietario(propietarioId);
  revalidarAgendaYPanel();
  return null;
}

export async function alternarTarea(
  tareaId: string,
  propietarioId: string,
  completada: boolean
) {
  await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("tareas")
    .update({
      estado: completada ? "completada" : "pendiente",
      completada_en: completada ? new Date().toISOString() : null,
    })
    .eq("id", tareaId);

  revalidarPropietario(propietarioId);
  revalidarAgendaYPanel();
}

export async function registrarDocumento(
  propietarioId: string,
  nombreArchivo: string,
  urlStorage: string,
  tipoDocumento: string | null
) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const { error } = await supabase.from("documentos").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "propietario",
    entidad_id: propietarioId,
    tipo_documento: tipoDocumento,
    nombre_archivo: nombreArchivo,
    url_storage: urlStorage,
    subido_por: usuario.id,
  });

  if (error) throw new Error("No se pudo registrar el documento");

  revalidarPropietario(propietarioId);
}

const SIGUIENTE_PASO: Record<
  string,
  { etiqueta: string; tipoEvento: string; diasOffset: number }
> = {
  llamar: { etiqueta: "Llamar a", tipoEvento: "llamada", diasOffset: 1 },
  enviar_documentacion: {
    etiqueta: "Enviar documentación a",
    tipoEvento: "recordatorio",
    diasOffset: 1,
  },
  programar_visita: { etiqueta: "Programar visita con", tipoEvento: "visita", diasOffset: 2 },
  esperar_respuesta: {
    etiqueta: "Hacer seguimiento de la respuesta de",
    tipoEvento: "recordatorio",
    diasOffset: 3,
  },
};

export async function crearSiguientePaso(
  propietarioId: string,
  nombrePropietario: string,
  paso: string
) {
  const usuario = await requireUsuario();
  const config = SIGUIENTE_PASO[paso];
  if (!config) throw new Error("Paso desconocido");

  const fecha = new Date();
  fecha.setDate(fecha.getDate() + config.diasOffset);
  const titulo = `${config.etiqueta} ${nombrePropietario}`;

  const supabase = await createClient();

  await Promise.all([
    supabase.from("tareas").insert({
      tenant_id: usuario.tenant_id,
      entidad_tipo: "propietario",
      entidad_id: propietarioId,
      asignado_a: usuario.id,
      titulo,
      fecha_vencimiento: fecha.toISOString(),
    }),
    supabase.from("eventos_agenda").insert({
      tenant_id: usuario.tenant_id,
      usuario_id: usuario.id,
      entidad_tipo: "propietario",
      entidad_id: propietarioId,
      tipo: config.tipoEvento,
      titulo,
      fecha_hora: fecha.toISOString(),
    }),
    supabase.from("propietarios").update({ fecha_proxima_accion: fecha.toISOString() }).eq("id", propietarioId),
    supabase.from("actividades").insert({
      tenant_id: usuario.tenant_id,
      entidad_tipo: "propietario",
      entidad_id: propietarioId,
      usuario_id: usuario.id,
      tipo: "sistema",
      contenido: `Siguiente paso: ${titulo}`,
    }),
  ]);

  revalidarPropietario(propietarioId);
  revalidarAgendaYPanel();
}

export type GuionState = { error: string } | { ok: true } | null;

export async function actualizarGuionCaptacion(
  propietarioId: string,
  _prevState: GuionState,
  formData: FormData
): Promise<GuionState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const respuestas = {
    motivo_venta: String(formData.get("motivo_venta") ?? "").trim(),
    plazo: String(formData.get("plazo") ?? "").trim(),
    otras_agencias: String(formData.get("otras_agencias") ?? "").trim(),
    precio_esperado: String(formData.get("precio_esperado") ?? "").trim(),
    acepta_exclusiva: String(formData.get("acepta_exclusiva") ?? "").trim(),
  };

  const gestor = esGestor(usuario.rol);
  const { error } = await supabase
    .from("propietarios")
    .update({ guion_captacion: respuestas })
    .eq("id", propietarioId)
    .eq(gestor ? "tenant_id" : "agente_id", gestor ? usuario.tenant_id : usuario.id);

  if (error) return { error: "No se pudo guardar el guion." };

  revalidarPropietario(propietarioId);
  return { ok: true };
}

export async function eliminarDocumento(documentoId: string, propietarioId: string, urlStorage: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase.storage.from("documentos").remove([urlStorage]);
  await supabase.from("documentos").delete().eq("id", documentoId).eq("tenant_id", usuario.tenant_id);

  revalidarPropietario(propietarioId);
}

export type CrearPropietarioRapidoState = { error: string; limite?: true } | { ok: true } | null;

export async function crearPropietarioRapido(
  _prevState: CrearPropietarioRapidoState,
  formData: FormData
): Promise<CrearPropietarioRapidoState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim() || null;

  if (!nombre || !telefono) {
    return { error: "Pon al menos el nombre y el teléfono." };
  }

  const limite = limiteRecurso(usuario.tenant ?? {}, "propietarios");
  if (limite !== null) {
    const { count } = await supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id);
    if ((count ?? 0) >= limite) {
      return {
        error: `Has llegado al límite de ${limite} captaciones del plan Gratis.`,
        limite: true,
      };
    }
  }

  const { error } = await supabase.from("propietarios").insert({
    tenant_id: usuario.tenant_id,
    agente_id: usuario.id,
    nombre,
    telefono,
    direccion,
  });

  if (error) return { error: "No se pudo guardar el propietario." };

  revalidarPropietario();
  return { ok: true };
}

export async function eliminarPropietario(id: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();
  const gestor = esGestor(usuario.rol);

  await supabase
    .from("propietarios")
    .delete()
    .eq("id", id)
    .eq(gestor ? "tenant_id" : "agente_id", gestor ? usuario.tenant_id : usuario.id);

  revalidarPropietario();
}
