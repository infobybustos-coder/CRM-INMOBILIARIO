import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdjuntoNuevo, AutorTipo, Conversacion, ConversacionConCliente, Mensaje } from "./tipos";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function insertarMensaje(
  admin: AdminClient,
  params: {
    conversacionId: string;
    autorId: string;
    autorTipo: AutorTipo;
    contenido: string;
    adjuntos: AdjuntoNuevo[];
  }
) {
  const { data: mensaje, error } = await admin
    .from("mensajes_conversacion")
    .insert({
      conversacion_id: params.conversacionId,
      autor_id: params.autorId,
      autor_tipo: params.autorTipo,
      contenido: params.contenido || null,
    })
    .select("id")
    .single();
  if (error || !mensaje) throw new Error("No se pudo guardar el mensaje.");

  if (params.adjuntos.length > 0) {
    await admin.from("adjuntos_conversacion").insert(
      params.adjuntos.map((a) => ({
        mensaje_id: mensaje.id,
        nombre_archivo: a.nombreArchivo,
        url_storage: a.urlStorage,
        tipo_mime: a.tipoMime,
        tamano_bytes: a.tamanoBytes,
      }))
    );
  }

  await admin
    .from("conversaciones")
    .update({ actualizado_en: new Date().toISOString() })
    .eq("id", params.conversacionId);

  return mensaje.id as string;
}

export async function listarMensajes(admin: AdminClient, conversacionId: string): Promise<Mensaje[]> {
  const { data } = await admin
    .from("mensajes_conversacion")
    .select(
      "id, autor_tipo, contenido, creado_en, adjuntos_conversacion(id, nombre_archivo, url_storage, tipo_mime)"
    )
    .eq("conversacion_id", conversacionId)
    .order("creado_en", { ascending: true });

  const mensajes: Mensaje[] = (data ?? []).map((m) => ({
    id: m.id,
    autorTipo: m.autor_tipo,
    contenido: m.contenido,
    creadoEn: m.creado_en,
    adjuntos: (m.adjuntos_conversacion ?? []).map((a) => ({
      id: a.id,
      nombreArchivo: a.nombre_archivo,
      urlStorage: a.url_storage,
      tipoMime: a.tipo_mime,
    })),
  }));

  await Promise.all(
    mensajes.flatMap((m) =>
      m.adjuntos.map(async (a) => {
        const { data: firmada } = await admin.storage
          .from("adjuntos_soporte")
          .createSignedUrl(a.urlStorage, 3600);
        a.urlFirmada = firmada?.signedUrl ?? null;
      })
    )
  );

  return mensajes;
}

export function mapConversacion(fila: {
  id: string;
  asunto: string;
  estado: string;
  creado_en: string;
  actualizado_en: string;
}): Conversacion {
  return {
    id: fila.id,
    asunto: fila.asunto,
    estado: fila.estado as Conversacion["estado"],
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

export async function listarConversacionesCliente(admin: AdminClient, usuarioId: string): Promise<Conversacion[]> {
  const { data } = await admin
    .from("conversaciones")
    .select("id, asunto, estado, creado_en, actualizado_en")
    .eq("creado_por", usuarioId)
    .order("actualizado_en", { ascending: false });
  return (data ?? []).map(mapConversacion);
}

// Para el aviso del nav: ¿tiene el cliente alguna conversación con una
// respuesta de soporte más reciente que su última visita?
export async function tieneRespuestaSinLeer(admin: AdminClient, usuarioId: string): Promise<boolean> {
  const { data } = await admin
    .from("conversaciones")
    .select("id, ultima_lectura_cliente, mensajes_conversacion(autor_tipo, creado_en)")
    .eq("creado_por", usuarioId)
    .neq("estado", "resuelta");

  for (const conversacion of data ?? []) {
    const mensajesSoporte = (conversacion.mensajes_conversacion ?? []).filter(
      (m) => m.autor_tipo === "soporte"
    );
    if (mensajesSoporte.length === 0) continue;
    const ultimo = mensajesSoporte.reduce((max, m) => (m.creado_en > max ? m.creado_en : max), mensajesSoporte[0].creado_en);
    const leidoHasta = conversacion.ultima_lectura_cliente;
    if (!leidoHasta || ultimo > leidoHasta) return true;
  }
  return false;
}

// Para el aviso del nav de superadmin: ¿hay algún mensaje de un cliente
// más reciente que la última vez que soporte revisó esa conversación?
export async function tieneMensajeClienteSinLeer(admin: AdminClient): Promise<boolean> {
  const { data } = await admin
    .from("conversaciones")
    .select("id, ultima_lectura_soporte, mensajes_conversacion(autor_tipo, creado_en)")
    .neq("estado", "resuelta");

  for (const conversacion of data ?? []) {
    const mensajesCliente = (conversacion.mensajes_conversacion ?? []).filter(
      (m) => m.autor_tipo === "cliente"
    );
    if (mensajesCliente.length === 0) continue;
    const ultimo = mensajesCliente.reduce((max, m) => (m.creado_en > max ? m.creado_en : max), mensajesCliente[0].creado_en);
    const leidoHasta = conversacion.ultima_lectura_soporte;
    if (!leidoHasta || ultimo > leidoHasta) return true;
  }
  return false;
}

export async function listarConversacionesTenant(admin: AdminClient, tenantId: string): Promise<Conversacion[]> {
  const { data } = await admin
    .from("conversaciones")
    .select("id, asunto, estado, creado_en, actualizado_en")
    .eq("tenant_id", tenantId)
    .order("actualizado_en", { ascending: false });
  return (data ?? []).map(mapConversacion);
}

export async function listarConversacionesAdmin(admin: AdminClient): Promise<ConversacionConCliente[]> {
  const { data } = await admin
    .from("conversaciones")
    .select(
      "id, tenant_id, creado_por, asunto, estado, creado_en, actualizado_en, usuario:usuarios!creado_por(nombre_completo, email, telefono, rol, ultimo_acceso, tenant:tenants(nombre, tipo_plan, plan_tarifa, creado_en))"
    )
    .order("actualizado_en", { ascending: false });

  return (data ?? []).map((c) => {
    const usuario = Array.isArray(c.usuario) ? c.usuario[0] : c.usuario;
    const tenant = usuario ? (Array.isArray(usuario.tenant) ? usuario.tenant[0] : usuario.tenant) : null;
    return {
      id: c.id,
      tenantId: c.tenant_id,
      creadoPor: c.creado_por,
      asunto: c.asunto,
      estado: c.estado as ConversacionConCliente["estado"],
      creadoEn: c.creado_en,
      actualizadoEn: c.actualizado_en,
      clienteNombre: usuario?.nombre_completo ?? "—",
      clienteEmail: usuario?.email ?? "—",
      clienteTelefono: usuario?.telefono ?? null,
      clienteRol: usuario?.rol ?? "—",
      clienteUltimoAcceso: usuario?.ultimo_acceso ?? null,
      tenantNombre: tenant?.nombre ?? "—",
      tenantTipoPlan: tenant?.tipo_plan ?? "—",
      tenantPlanTarifa: tenant?.plan_tarifa ?? "—",
      tenantCreadoEn: tenant?.creado_en ?? c.creado_en,
    };
  });
}
