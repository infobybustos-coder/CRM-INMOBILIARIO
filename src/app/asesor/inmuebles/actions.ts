"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  return usuario;
}

export type GuardarInmuebleState = { error: string } | { ok: true } | null;

export async function actualizarInmueble(
  id: string,
  _prevState: GuardarInmuebleState,
  formData: FormData
): Promise<GuardarInmuebleState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const direccion = String(formData.get("direccion") ?? "").trim();
  if (!direccion) return { error: "La dirección es obligatoria." };

  const referencia = String(formData.get("referencia") ?? "").trim();
  const estado = String(formData.get("estado") ?? "").trim();
  const precio = formData.get("precio");
  const metrosCuadrados = formData.get("metros_cuadrados");
  const habitaciones = formData.get("habitaciones");
  const banos = formData.get("banos");
  const fechaPublicacion = formData.get("fecha_publicacion");
  const zonaId = String(formData.get("zona_id") ?? "");
  const propietarioId = String(formData.get("propietario_id") ?? "");

  const gestor = esGestor(usuario.rol);
  const filtroCol = gestor ? "tenant_id" : "agente_id";
  const filtroVal = gestor ? usuario.tenant_id : usuario.id;

  const { data: actual } = await supabase
    .from("inmuebles")
    .select("estado")
    .eq("id", id)
    .eq(filtroCol, filtroVal)
    .single();

  const { error } = await supabase
    .from("inmuebles")
    .update({
      direccion,
      referencia: referencia || null,
      estado: estado || undefined,
      zona_id: zonaId || null,
      propietario_id: propietarioId || null,
      precio: precio ? Number(precio) : null,
      metros_cuadrados: metrosCuadrados ? Number(metrosCuadrados) : null,
      habitaciones: habitaciones ? Number(habitaciones) : null,
      banos: banos ? Number(banos) : null,
      tipo: String(formData.get("tipo") ?? "") || null,
      certificado_energetico: String(formData.get("certificado_energetico") ?? "").trim() || null,
      descripcion: String(formData.get("descripcion") ?? "").trim() || null,
      fecha_publicacion: fechaPublicacion ? String(fechaPublicacion) : null,
    })
    .eq("id", id)
    .eq(filtroCol, filtroVal);

  if (error) {
    return error.code === "23505"
      ? { error: "Esa referencia ya existe." }
      : { error: "No se pudo guardar." };
  }

  if (estado && actual && actual.estado !== estado) {
    await supabase.from("actividades").insert({
      tenant_id: usuario.tenant_id,
      entidad_tipo: "inmueble",
      entidad_id: id,
      usuario_id: usuario.id,
      tipo: "cambio_estado",
      contenido: `Cambió el estado a "${estado}"`,
    });
  }

  revalidatePath(`/asesor/inmuebles/${id}`);
  revalidatePath("/asesor/inmuebles");
  return { ok: true };
}

export type NotaState = { error: string } | null;

export async function crearNota(
  inmuebleId: string,
  _prevState: NotaState,
  formData: FormData
): Promise<NotaState> {
  const usuario = await requireUsuario();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return { error: "Escribe algo antes de guardar." };

  const supabase = await createClient();
  const { error } = await supabase.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "inmueble",
    entidad_id: inmuebleId,
    usuario_id: usuario.id,
    tipo: "nota",
    contenido,
  });

  if (error) return { error: "No se pudo guardar la nota." };

  revalidatePath(`/asesor/inmuebles/${inmuebleId}`);
  return null;
}

export type TareaState = { error: string } | null;

export async function crearTarea(
  inmuebleId: string,
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
    entidad_tipo: "inmueble",
    entidad_id: inmuebleId,
    asignado_a: usuario.id,
    titulo,
    fecha_vencimiento: fechaVencimiento ? String(fechaVencimiento) : null,
  });

  if (error) return { error: "No se pudo crear la tarea." };

  revalidatePath(`/asesor/inmuebles/${inmuebleId}`);
  revalidatePath("/asesor", "layout");
  revalidatePath("/asesor/agenda");
  return null;
}

export async function alternarTarea(tareaId: string, inmuebleId: string, completada: boolean) {
  await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("tareas")
    .update({
      estado: completada ? "completada" : "pendiente",
      completada_en: completada ? new Date().toISOString() : null,
    })
    .eq("id", tareaId);

  revalidatePath(`/asesor/inmuebles/${inmuebleId}`);
  revalidatePath("/asesor", "layout");
  revalidatePath("/asesor/agenda");
  revalidatePath("/asesor/agenda");
}

export type ZonaState = { error: string } | { ok: true; zona: { id: string; nombre: string; ciudad: string | null } } | null;

export async function crearZona(_prevState: ZonaState, formData: FormData): Promise<ZonaState> {
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

export async function registrarFoto(inmuebleId: string, nombreArchivo: string, urlStorage: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const { error } = await supabase.from("documentos").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "inmueble",
    entidad_id: inmuebleId,
    tipo_documento: "foto",
    nombre_archivo: nombreArchivo,
    url_storage: urlStorage,
    subido_por: usuario.id,
  });

  if (error) throw new Error("No se pudo registrar la foto");

  revalidatePath(`/asesor/inmuebles/${inmuebleId}`);
}

export async function eliminarFoto(fotoId: string, inmuebleId: string, urlStorage: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase.storage.from("documentos").remove([urlStorage]);
  await supabase.from("documentos").delete().eq("id", fotoId).eq("tenant_id", usuario.tenant_id);

  revalidatePath(`/asesor/inmuebles/${inmuebleId}`);
}
