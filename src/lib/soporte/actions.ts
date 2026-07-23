"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertarMensaje } from "./db";
import type { AdjuntoNuevo } from "./tipos";

function revalidarSoporte() {
  revalidatePath("/asesor/soporte");
  revalidatePath("/inmobiliaria/soporte");
  revalidatePath("/superadmin/soporte");
}

export type CrearConversacionState = { error: string } | { ok: true; conversacionId: string };

// Crea solo la conversación vacía (sin mensaje todavía): los adjuntos se
// suben a una carpeta con el id de la conversación, así que primero tiene
// que existir la fila para que la política de Storage la reconozca. El
// primer mensaje se manda justo después con enviarMensajeCliente.
export async function crearConversacion(asunto: string): Promise<CrearConversacionState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const asuntoLimpio = asunto.trim();
  if (!asuntoLimpio) return { error: "Escribe un asunto." };

  const admin = createAdminClient();
  const { data: conversacion, error } = await admin
    .from("conversaciones")
    .insert({ tenant_id: usuario.tenant_id, creado_por: usuario.id, asunto: asuntoLimpio })
    .select("id")
    .single();
  if (error || !conversacion) return { error: "No se pudo crear la conversación. Inténtalo de nuevo." };

  revalidarSoporte();
  return { ok: true, conversacionId: conversacion.id };
}

export type EnviarMensajeState = { error: string } | { ok: true };

export async function enviarMensajeCliente(
  conversacionId: string,
  contenido: string,
  adjuntos: AdjuntoNuevo[]
): Promise<EnviarMensajeState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const contenidoLimpio = contenido.trim();
  if (!contenidoLimpio && adjuntos.length === 0) return { error: "Escribe un mensaje o adjunta un archivo." };

  const admin = createAdminClient();
  const { data: conversacion } = await admin
    .from("conversaciones")
    .select("id, creado_por")
    .eq("id", conversacionId)
    .maybeSingle();
  if (!conversacion || conversacion.creado_por !== usuario.id) return { error: "Conversación no encontrada." };

  try {
    await insertarMensaje(admin, {
      conversacionId,
      autorId: usuario.id,
      autorTipo: "cliente",
      contenido: contenidoLimpio,
      adjuntos,
    });
  } catch {
    return { error: "No se pudo enviar el mensaje. Inténtalo de nuevo." };
  }

  await admin
    .from("conversaciones")
    .update({ ultima_lectura_cliente: new Date().toISOString() })
    .eq("id", conversacionId);

  revalidarSoporte();
  return { ok: true };
}

export async function marcarLeidoCliente(conversacionId: string) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return;

  const admin = createAdminClient();
  await admin
    .from("conversaciones")
    .update({ ultima_lectura_cliente: new Date().toISOString() })
    .eq("id", conversacionId)
    .eq("creado_por", usuario.id);

  revalidarSoporte();
}

export async function cerrarConversacionCliente(conversacionId: string) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return;

  const admin = createAdminClient();
  await admin
    .from("conversaciones")
    .update({ estado: "resuelta" })
    .eq("id", conversacionId)
    .eq("creado_por", usuario.id);

  revalidarSoporte();
}
