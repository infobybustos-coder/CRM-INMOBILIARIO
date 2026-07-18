import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Adjunto,
  AdjuntoNuevo,
  Companero,
  ConversacionConParticipante,
  DatosTarjeta,
  EntidadCompartible,
  Mensaje,
  ResultadoBusqueda,
  TarjetaRef,
} from "./tipos";

type AdminClient = ReturnType<typeof createAdminClient>;

const RUTA_ENTIDAD: Record<string, string> = {
  inmueble: "/inmobiliaria/inmuebles",
  propietario: "/inmobiliaria/propietarios",
  comprador: "/inmobiliaria/compradores",
  tarea: "/inmobiliaria/tareas",
};

export async function listarConversaciones(
  admin: AdminClient,
  usuarioId: string
): Promise<ConversacionConParticipante[]> {
  const { data: misParticipaciones } = await admin
    .from("conversaciones_participantes")
    .select("conversacion_id, ultima_lectura")
    .eq("usuario_id", usuarioId);
  if (!misParticipaciones || misParticipaciones.length === 0) return [];

  const ids = misParticipaciones.map((p) => p.conversacion_id);
  const miLecturaPorConversacion = new Map(misParticipaciones.map((p) => [p.conversacion_id, p.ultima_lectura]));

  const [{ data: conversaciones }, { data: participantes }, { data: mensajesRecientes }] = await Promise.all([
    admin
      .from("conversaciones_internas")
      .select("id, entidad_tipo, entidad_id, creado_en, actualizado_en")
      .in("id", ids)
      .order("actualizado_en", { ascending: false }),
    admin
      .from("conversaciones_participantes")
      .select("conversacion_id, usuario_id, ultima_lectura, usuario:usuarios(nombre_completo, avatar_url, ultima_actividad)")
      .in("conversacion_id", ids),
    admin
      .from("mensajes_internos")
      .select("conversacion_id, autor_id, contenido, creado_en")
      .in("conversacion_id", ids)
      .order("creado_en", { ascending: false })
      .limit(300),
  ]);

  const ultimoMensajePorConversacion = new Map<
    string,
    { contenido: string | null; creadoEn: string; autorId: string }
  >();
  for (const m of mensajesRecientes ?? []) {
    if (!ultimoMensajePorConversacion.has(m.conversacion_id)) {
      ultimoMensajePorConversacion.set(m.conversacion_id, {
        contenido: m.contenido,
        creadoEn: m.creado_en,
        autorId: m.autor_id,
      });
    }
  }

  // Título corto de la entidad fijada de cada conversación, para la
  // lista — solo el nombre, sin foto ni resto de campos (eso lo
  // resuelve resolverTarjeta, más caro, solo para la conversación abierta).
  const idsPorTipo: Partial<Record<EntidadCompartible, string[]>> = {};
  for (const c of conversaciones ?? []) {
    if (c.entidad_tipo && c.entidad_id) {
      const tipo = c.entidad_tipo as EntidadCompartible;
      (idsPorTipo[tipo] ??= []).push(c.entidad_id);
    }
  }

  const tituloPorEntidad = new Map<string, string>();
  await Promise.all([
    (async () => {
      if (!idsPorTipo.inmueble?.length) return;
      const { data } = await admin.from("inmuebles").select("id, direccion").in("id", idsPorTipo.inmueble);
      for (const i of data ?? []) tituloPorEntidad.set(`inmueble:${i.id}`, i.direccion);
    })(),
    (async () => {
      if (!idsPorTipo.propietario?.length) return;
      const { data } = await admin.from("propietarios").select("id, nombre").in("id", idsPorTipo.propietario);
      for (const p of data ?? []) tituloPorEntidad.set(`propietario:${p.id}`, p.nombre);
    })(),
    (async () => {
      if (!idsPorTipo.comprador?.length) return;
      const { data } = await admin.from("compradores").select("id, nombre").in("id", idsPorTipo.comprador);
      for (const c of data ?? []) tituloPorEntidad.set(`comprador:${c.id}`, c.nombre);
    })(),
    (async () => {
      if (!idsPorTipo.tarea?.length) return;
      const { data } = await admin.from("tareas").select("id, titulo").in("id", idsPorTipo.tarea);
      for (const t of data ?? []) tituloPorEntidad.set(`tarea:${t.id}`, t.titulo);
    })(),
    (async () => {
      if (!idsPorTipo.visita?.length) return;
      const { data } = await admin
        .from("eventos_agenda")
        .select("id, inmueble:inmuebles(direccion), comprador:compradores(nombre)")
        .in("id", idsPorTipo.visita);
      for (const v of data ?? []) {
        const inmueble = Array.isArray(v.inmueble) ? v.inmueble[0] : v.inmueble;
        const comprador = Array.isArray(v.comprador) ? v.comprador[0] : v.comprador;
        tituloPorEntidad.set(`visita:${v.id}`, inmueble?.direccion ?? comprador?.nombre ?? "Visita");
      }
    })(),
  ]);

  return (conversaciones ?? []).map((c) => {
    const otro = (participantes ?? []).find((p) => p.conversacion_id === c.id && p.usuario_id !== usuarioId);
    const otroUsuario = otro ? (Array.isArray(otro.usuario) ? otro.usuario[0] : otro.usuario) : null;
    const ultimo = ultimoMensajePorConversacion.get(c.id) ?? null;
    const miLectura = miLecturaPorConversacion.get(c.id) ?? null;

    const sinLeer = Boolean(ultimo && ultimo.autorId !== usuarioId && (!miLectura || ultimo.creadoEn > miLectura));

    return {
      id: c.id,
      entidadTipo: c.entidad_tipo as EntidadCompartible | null,
      entidadId: c.entidad_id,
      entidadTitulo: c.entidad_tipo && c.entidad_id ? (tituloPorEntidad.get(`${c.entidad_tipo}:${c.entidad_id}`) ?? null) : null,
      creadoEn: c.creado_en,
      actualizadoEn: c.actualizado_en,
      otroUsuarioId: otro?.usuario_id ?? "",
      otroNombre: otroUsuario?.nombre_completo ?? "—",
      otroAvatarUrl: otroUsuario?.avatar_url
        ? admin.storage.from("avatares").getPublicUrl(otroUsuario.avatar_url).data.publicUrl
        : null,
      otroUltimaActividad: otroUsuario?.ultima_actividad ?? null,
      ultimoMensaje: ultimo?.contenido ?? null,
      ultimoMensajeEn: ultimo?.creadoEn ?? null,
      sinLeer,
      miUltimaLectura: miLectura,
      otraUltimaLectura: otro?.ultima_lectura ?? null,
    };
  });
}

export async function listarMensajes(
  admin: AdminClient,
  tenantId: string,
  conversacionId: string,
  desde?: string
): Promise<Mensaje[]> {
  let query = admin
    .from("mensajes_internos")
    .select(
      "id, autor_id, contenido, creado_en, adjuntos_mensaje_interno(id, nombre_archivo, url_storage, tipo_mime), tarjetas_mensaje(id, entidad_tipo, entidad_id)"
    )
    .eq("conversacion_id", conversacionId)
    .order("creado_en", { ascending: true });
  if (desde) query = query.gt("creado_en", desde);

  const { data } = await query;

  const mensajes: Mensaje[] = (data ?? []).map((m) => ({
    id: m.id,
    autorId: m.autor_id,
    contenido: m.contenido,
    creadoEn: m.creado_en,
    adjuntos: (m.adjuntos_mensaje_interno ?? []).map(
      (a): Adjunto => ({
        id: a.id,
        nombreArchivo: a.nombre_archivo,
        urlStorage: a.url_storage,
        tipoMime: a.tipo_mime,
      })
    ),
    // "datos" se rellena justo abajo, en paralelo, con resolverTarjeta.
    tarjetas: (m.tarjetas_mensaje ?? []).map(
      (t): TarjetaRef => ({
        id: t.id,
        entidadTipo: t.entidad_tipo as EntidadCompartible,
        entidadId: t.entidad_id,
        datos: { disponible: false, entidadTipo: t.entidad_tipo as EntidadCompartible, entidadId: t.entidad_id },
      })
    ),
  }));

  await Promise.all([
    ...mensajes.flatMap((m) =>
      m.adjuntos.map(async (a) => {
        const { data: firmada } = await admin.storage.from("adjuntos_internos").createSignedUrl(a.urlStorage, 3600);
        a.urlFirmada = firmada?.signedUrl ?? null;
      })
    ),
    ...mensajes.flatMap((m) =>
      m.tarjetas.map(async (t) => {
        t.datos = await resolverTarjeta(admin, tenantId, t.entidadTipo, t.entidadId);
      })
    ),
  ]);

  return mensajes;
}

export async function marcarLeido(admin: AdminClient, conversacionId: string, usuarioId: string) {
  await admin
    .from("conversaciones_participantes")
    .update({ ultima_lectura: new Date().toISOString() })
    .eq("conversacion_id", conversacionId)
    .eq("usuario_id", usuarioId);
}

// Para el aviso del nav: ¿tiene el usuario algún mensaje ajeno más
// reciente que su última lectura de esa conversación?
export async function tieneMensajeSinLeer(admin: AdminClient, usuarioId: string): Promise<boolean> {
  const { data: participaciones } = await admin
    .from("conversaciones_participantes")
    .select("conversacion_id, ultima_lectura")
    .eq("usuario_id", usuarioId);
  if (!participaciones || participaciones.length === 0) return false;

  const ids = participaciones.map((p) => p.conversacion_id);
  const { data: mensajes } = await admin
    .from("mensajes_internos")
    .select("conversacion_id, autor_id, creado_en")
    .in("conversacion_id", ids)
    .neq("autor_id", usuarioId)
    .order("creado_en", { ascending: false })
    .limit(200);

  const lecturaPorConversacion = new Map(participaciones.map((p) => [p.conversacion_id, p.ultima_lectura]));
  for (const m of mensajes ?? []) {
    const leidoHasta = lecturaPorConversacion.get(m.conversacion_id);
    if (!leidoHasta || m.creado_en > leidoHasta) return true;
  }
  return false;
}

export async function listarCompaneros(
  admin: AdminClient,
  tenantId: string,
  excluirUsuarioId: string
): Promise<Companero[]> {
  const { data } = await admin
    .from("usuarios")
    .select("id, nombre_completo, email, rol, avatar_url, ultima_actividad")
    .eq("tenant_id", tenantId)
    .neq("id", excluirUsuarioId)
    .in("rol", ["admin", "empleado"])
    .order("nombre_completo");

  return (data ?? []).map((u) => ({
    id: u.id,
    nombreCompleto: u.nombre_completo,
    email: u.email,
    rol: u.rol,
    avatarUrl: u.avatar_url ? admin.storage.from("avatares").getPublicUrl(u.avatar_url).data.publicUrl : null,
    ultimaActividad: u.ultima_actividad,
  }));
}

async function buscarVisitas(admin: AdminClient, tenantId: string, query: string): Promise<ResultadoBusqueda[]> {
  const { data } = await admin
    .from("eventos_agenda")
    .select("id, fecha_hora, inmueble:inmuebles(direccion), comprador:compradores(nombre)")
    .eq("tenant_id", tenantId)
    .eq("tipo", "visita")
    .order("fecha_hora", { ascending: false })
    .limit(30);

  const filas: ResultadoBusqueda[] = (data ?? []).map((v) => {
    const inmueble = Array.isArray(v.inmueble) ? v.inmueble[0] : v.inmueble;
    const comprador = Array.isArray(v.comprador) ? v.comprador[0] : v.comprador;
    const subtitulo = inmueble?.direccion ?? comprador?.nombre ?? "Visita";
    return {
      entidadTipo: "visita",
      entidadId: v.id,
      titulo: new Date(v.fecha_hora).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      subtitulo,
    };
  });

  const filtro = query.trim().toLowerCase();
  return (filtro ? filas.filter((f) => f.subtitulo.toLowerCase().includes(filtro)) : filas).slice(0, 8);
}

export async function buscarEntidadesCompartibles(
  admin: AdminClient,
  tenantId: string,
  query: string
): Promise<ResultadoBusqueda[]> {
  const texto = query.trim();
  const patron = `%${texto}%`;

  const [propietarios, inmuebles, compradores, visitas, tareas] = await Promise.all([
    admin.from("propietarios").select("id, nombre, estado").eq("tenant_id", tenantId).ilike("nombre", patron).limit(8),
    admin
      .from("inmuebles")
      .select("id, direccion, referencia")
      .eq("tenant_id", tenantId)
      .or(`direccion.ilike.${patron},referencia.ilike.${patron}`)
      .limit(8),
    admin.from("compradores").select("id, nombre, estado").eq("tenant_id", tenantId).ilike("nombre", patron).limit(8),
    buscarVisitas(admin, tenantId, texto),
    admin.from("tareas").select("id, titulo, estado").eq("tenant_id", tenantId).ilike("titulo", patron).limit(8),
  ]);

  const resultados: ResultadoBusqueda[] = [];
  for (const p of propietarios.data ?? []) {
    resultados.push({ entidadTipo: "propietario", entidadId: p.id, titulo: p.nombre, subtitulo: "Propietario" });
  }
  for (const i of inmuebles.data ?? []) {
    resultados.push({
      entidadTipo: "inmueble",
      entidadId: i.id,
      titulo: i.direccion,
      subtitulo: i.referencia ? `Ref. ${i.referencia}` : "Inmueble",
    });
  }
  for (const c of compradores.data ?? []) {
    resultados.push({ entidadTipo: "comprador", entidadId: c.id, titulo: c.nombre, subtitulo: "Comprador" });
  }
  resultados.push(...visitas);
  for (const t of tareas.data ?? []) {
    resultados.push({ entidadTipo: "tarea", entidadId: t.id, titulo: t.titulo, subtitulo: "Tarea" });
  }

  return resultados;
}

export async function resolverTarjeta(
  admin: AdminClient,
  tenantId: string,
  entidadTipo: EntidadCompartible,
  entidadId: string
): Promise<DatosTarjeta> {
  if (entidadTipo === "inmueble") {
    const { data } = await admin
      .from("inmuebles")
      .select("id, direccion, referencia, precio, estado")
      .eq("tenant_id", tenantId)
      .eq("id", entidadId)
      .maybeSingle();
    if (!data) return { disponible: false, entidadTipo, entidadId };

    const { data: foto } = await admin
      .from("documentos")
      .select("url_storage")
      .eq("entidad_tipo", "inmueble")
      .eq("entidad_id", entidadId)
      .eq("tipo_documento", "foto")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    let imagenUrl: string | null = null;
    if (foto) {
      const { data: firmada } = await admin.storage.from("documentos").createSignedUrl(foto.url_storage, 3600);
      imagenUrl = firmada?.signedUrl ?? null;
    }

    return {
      disponible: true,
      entidadTipo: "inmueble",
      entidadId,
      href: `${RUTA_ENTIDAD.inmueble}/${entidadId}`,
      imagenUrl,
      direccion: data.direccion,
      referencia: data.referencia,
      precio: data.precio,
      estado: data.estado,
    };
  }

  if (entidadTipo === "propietario") {
    const { data } = await admin
      .from("propietarios")
      .select("id, nombre, telefono, estado")
      .eq("tenant_id", tenantId)
      .eq("id", entidadId)
      .maybeSingle();
    if (!data) return { disponible: false, entidadTipo, entidadId };
    return {
      disponible: true,
      entidadTipo: "propietario",
      entidadId,
      href: `${RUTA_ENTIDAD.propietario}/${entidadId}`,
      nombre: data.nombre,
      telefono: data.telefono,
      estado: data.estado,
    };
  }

  if (entidadTipo === "comprador") {
    const { data } = await admin
      .from("compradores")
      .select("id, nombre, presupuesto_max, estado")
      .eq("tenant_id", tenantId)
      .eq("id", entidadId)
      .maybeSingle();
    if (!data) return { disponible: false, entidadTipo, entidadId };
    return {
      disponible: true,
      entidadTipo: "comprador",
      entidadId,
      href: `${RUTA_ENTIDAD.comprador}/${entidadId}`,
      nombre: data.nombre,
      presupuestoMax: data.presupuesto_max,
      estado: data.estado,
    };
  }

  if (entidadTipo === "tarea") {
    const { data } = await admin
      .from("tareas")
      .select("id, titulo, fecha_vencimiento, estado")
      .eq("tenant_id", tenantId)
      .eq("id", entidadId)
      .maybeSingle();
    if (!data) return { disponible: false, entidadTipo, entidadId };
    return {
      disponible: true,
      entidadTipo: "tarea",
      entidadId,
      href: `${RUTA_ENTIDAD.tarea}/${entidadId}`,
      titulo: data.titulo,
      fechaVencimiento: data.fecha_vencimiento,
      estado: data.estado,
    };
  }

  // visita
  const { data } = await admin
    .from("eventos_agenda")
    .select("id, fecha_hora, estado, inmueble_id, comprador_id, inmueble:inmuebles(direccion), comprador:compradores(nombre)")
    .eq("tenant_id", tenantId)
    .eq("id", entidadId)
    .maybeSingle();
  if (!data) return { disponible: false, entidadTipo, entidadId };

  const inmueble = Array.isArray(data.inmueble) ? data.inmueble[0] : data.inmueble;
  const comprador = Array.isArray(data.comprador) ? data.comprador[0] : data.comprador;
  const subtitulo = inmueble?.direccion ?? comprador?.nombre ?? "Visita";
  const href = data.inmueble_id
    ? `${RUTA_ENTIDAD.inmueble}/${data.inmueble_id}`
    : data.comprador_id
      ? `${RUTA_ENTIDAD.comprador}/${data.comprador_id}`
      : null;

  return {
    disponible: true,
    entidadTipo: "visita",
    entidadId,
    href,
    fechaHora: data.fecha_hora,
    estado: data.estado,
    subtitulo,
  };
}

export type { AdjuntoNuevo };
