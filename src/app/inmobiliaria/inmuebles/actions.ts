"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  return usuario;
}

export type CrearInmuebleState = { error: string } | { ok: true } | null;

export async function crearInmueble(
  _prevState: CrearInmuebleState,
  formData: FormData
): Promise<CrearInmuebleState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const direccion = String(formData.get("direccion") ?? "").trim();
  if (!direccion) return { error: "La dirección es obligatoria." };

  const precio = formData.get("precio");
  const metrosCuadrados = formData.get("metros_cuadrados");
  const habitaciones = formData.get("habitaciones");
  const banos = formData.get("banos");
  const fechaPublicacion = formData.get("fecha_publicacion");
  const zonaId = String(formData.get("zona_id") ?? "");
  const propietarioId = String(formData.get("propietario_id") ?? "");

  const { data, error } = await supabase
    .from("inmuebles")
    .insert({
      tenant_id: usuario.tenant_id,
      agente_id: usuario.id,
      direccion,
      referencia: String(formData.get("referencia") ?? "").trim() || null,
      estado: "captacion",
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
    .select("id")
    .single();

  if (error) {
    return error.code === "23505"
      ? { error: "Esa referencia ya existe." }
      : { error: "No se pudo crear el inmueble." };
  }

  revalidatePath("/inmobiliaria/inmuebles");
  redirect(`/inmobiliaria/inmuebles/${data.id}`);
}

export type ActualizarInmuebleState = { error: string } | { ok: true } | null;

export async function actualizarInmuebleInmobiliaria(
  id: string,
  _prevState: ActualizarInmuebleState,
  formData: FormData
): Promise<ActualizarInmuebleState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const direccion = String(formData.get("direccion") ?? "").trim();
  if (!direccion) return { error: "La dirección es obligatoria." };

  const gestor = esGestor(usuario.rol);
  const precio = formData.get("precio");
  const metrosCuadrados = formData.get("metros_cuadrados");
  const habitaciones = formData.get("habitaciones");
  const banos = formData.get("banos");
  const fechaPublicacion = formData.get("fecha_publicacion");
  const zonaId = String(formData.get("zona_id") ?? "");
  const propietarioId = String(formData.get("propietario_id") ?? "");
  const estado = String(formData.get("estado") ?? "").trim();

  const { error } = await supabase
    .from("inmuebles")
    .update({
      direccion,
      referencia: String(formData.get("referencia") ?? "").trim() || null,
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
    .eq("tenant_id", usuario.tenant_id);

  if (error) {
    return error.code === "23505"
      ? { error: "Esa referencia ya existe." }
      : { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath(`/inmobiliaria/inmuebles/${id}`);
  revalidatePath("/inmobiliaria/inmuebles");
  return { ok: true };
}

export type NotaState = { error: string } | null;

export async function crearNotaInmueble(
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

  revalidatePath(`/inmobiliaria/inmuebles/${inmuebleId}`);
  return null;
}

export type TareaState = { error: string } | null;

export async function crearTareaInmueble(
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

  revalidatePath(`/inmobiliaria/inmuebles/${inmuebleId}`);
  return null;
}

export async function alternarTareaInmueble(
  tareaId: string,
  inmuebleId: string,
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

  revalidatePath(`/inmobiliaria/inmuebles/${inmuebleId}`);
}
