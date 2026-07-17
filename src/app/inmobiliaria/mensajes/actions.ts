"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioEfectivo } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buscarEntidadesCompartibles,
  listarCompaneros,
  listarConversaciones,
  listarMensajes,
  marcarLeido,
} from "@/lib/mensajes/db";
import type { AdjuntoNuevo, EntidadCompartible } from "@/lib/mensajes/tipos";

async function requireUsuario() {
  const usuario = await getUsuarioEfectivo();
  if (!usuario) throw new Error("No autenticado");
  if (usuario.tenant?.tipo_plan !== "inmobiliaria") throw new Error("Mensajes no está disponible para este plan.");
  if (usuario.tenant?.plan_tarifa !== "pago") throw new Error("Mensajes es una función del Plan PRO.");
  return usuario;
}

function revalidarMensajes() {
  revalidatePath("/inmobiliaria/mensajes");
}

export async function obtenerConversaciones() {
  const usuario = await requireUsuario();
  return listarConversaciones(createAdminClient(), usuario.id);
}

export async function obtenerCompaneros() {
  const usuario = await requireUsuario();
  return listarCompaneros(createAdminClient(), usuario.tenant_id, usuario.id);
}

export async function buscarEntidades(query: string) {
  const usuario = await requireUsuario();
  return buscarEntidadesCompartibles(createAdminClient(), usuario.tenant_id, query);
}

export async function obtenerMensajesNuevos(conversacionId: string, desde?: string) {
  const usuario = await requireUsuario();
  const admin = createAdminClient();

  const { data: participa } = await admin
    .from("conversaciones_participantes")
    .select("usuario_id")
    .eq("conversacion_id", conversacionId)
    .eq("usuario_id", usuario.id)
    .maybeSingle();
  if (!participa) return [];

  return listarMensajes(admin, usuario.tenant_id, conversacionId, desde);
}

export type CrearConversacionResultado = { ok: true; conversacionId: string } | { error: string };

export async function crearConversacion(
  otroUsuarioId: string,
  entidadTipo?: EntidadCompartible,
  entidadId?: string
): Promise<CrearConversacionResultado> {
  const usuario = await requireUsuario();
  const admin = createAdminClient();

  const { data: otro } = await admin
    .from("usuarios")
    .select("id")
    .eq("id", otroUsuarioId)
    .eq("tenant_id", usuario.tenant_id)
    .maybeSingle();
  if (!otro) return { error: "Usuario no válido." };

  const { data: conversacion, error } = await admin
    .from("conversaciones_internas")
    .insert({
      tenant_id: usuario.tenant_id,
      entidad_tipo: entidadTipo ?? null,
      entidad_id: entidadId ?? null,
      creado_por: usuario.id,
    })
    .select("id")
    .single();
  if (error || !conversacion) return { error: "No se pudo crear la conversación." };

  await admin.from("conversaciones_participantes").insert([
    { conversacion_id: conversacion.id, usuario_id: usuario.id, ultima_lectura: new Date().toISOString() },
    { conversacion_id: conversacion.id, usuario_id: otroUsuarioId },
  ]);

  revalidarMensajes();
  return { ok: true, conversacionId: conversacion.id };
}

export type EnviarMensajeResultado = { ok: true; mensajeId: string } | { error: string };

export async function enviarMensaje(
  conversacionId: string,
  contenido: string,
  adjuntos: AdjuntoNuevo[],
  tarjetas: { entidadTipo: EntidadCompartible; entidadId: string }[]
): Promise<EnviarMensajeResultado> {
  const usuario = await requireUsuario();
  const admin = createAdminClient();

  const { data: participa } = await admin
    .from("conversaciones_participantes")
    .select("usuario_id")
    .eq("conversacion_id", conversacionId)
    .eq("usuario_id", usuario.id)
    .maybeSingle();
  if (!participa) return { error: "No formas parte de esta conversación." };

  const contenidoLimpio = contenido.trim();
  if (!contenidoLimpio && adjuntos.length === 0 && tarjetas.length === 0) {
    return { error: "Escribe un mensaje o adjunta algo." };
  }

  const { data: mensaje, error } = await admin
    .from("mensajes_internos")
    .insert({ conversacion_id: conversacionId, autor_id: usuario.id, contenido: contenidoLimpio || null })
    .select("id")
    .single();
  if (error || !mensaje) return { error: "No se pudo enviar el mensaje." };

  if (adjuntos.length > 0) {
    await admin.from("adjuntos_mensaje_interno").insert(
      adjuntos.map((a) => ({
        mensaje_id: mensaje.id,
        nombre_archivo: a.nombreArchivo,
        url_storage: a.urlStorage,
        tipo_mime: a.tipoMime,
        tamano_bytes: a.tamanoBytes,
      }))
    );
  }

  if (tarjetas.length > 0) {
    await admin
      .from("tarjetas_mensaje")
      .insert(tarjetas.map((t) => ({ mensaje_id: mensaje.id, entidad_tipo: t.entidadTipo, entidad_id: t.entidadId })));
  }

  await admin
    .from("conversaciones_internas")
    .update({ actualizado_en: new Date().toISOString() })
    .eq("id", conversacionId);
  await marcarLeido(admin, conversacionId, usuario.id);

  revalidarMensajes();
  return { ok: true, mensajeId: mensaje.id };
}

export async function marcarConversacionLeida(conversacionId: string) {
  const usuario = await requireUsuario();
  await marcarLeido(createAdminClient(), conversacionId, usuario.id);
  revalidarMensajes();
}

export type CompartirDestino = { conversacionId: string } | { usuarioId: string };
export type CompartirResultado = { ok: true; conversacionId: string } | { error: string };

export async function compartirEnMensajes(
  entidadTipo: EntidadCompartible,
  entidadId: string,
  destino: CompartirDestino
): Promise<CompartirResultado> {
  const usuario = await requireUsuario();
  const admin = createAdminClient();

  let conversacionId: string;
  if ("conversacionId" in destino) {
    const { data: participa } = await admin
      .from("conversaciones_participantes")
      .select("usuario_id")
      .eq("conversacion_id", destino.conversacionId)
      .eq("usuario_id", usuario.id)
      .maybeSingle();
    if (!participa) return { error: "No formas parte de esa conversación." };
    conversacionId = destino.conversacionId;
  } else {
    const creada = await crearConversacion(destino.usuarioId, entidadTipo, entidadId);
    if ("error" in creada) return creada;
    conversacionId = creada.conversacionId;
  }

  const { data: mensaje, error } = await admin
    .from("mensajes_internos")
    .insert({ conversacion_id: conversacionId, autor_id: usuario.id, contenido: null })
    .select("id")
    .single();
  if (error || !mensaje) return { error: "No se pudo compartir." };

  await admin
    .from("tarjetas_mensaje")
    .insert({ mensaje_id: mensaje.id, entidad_tipo: entidadTipo, entidad_id: entidadId });
  await admin
    .from("conversaciones_internas")
    .update({ actualizado_en: new Date().toISOString() })
    .eq("id", conversacionId);
  await marcarLeido(admin, conversacionId, usuario.id);

  revalidarMensajes();
  return { ok: true, conversacionId };
}
