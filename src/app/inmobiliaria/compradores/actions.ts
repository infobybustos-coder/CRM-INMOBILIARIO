"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  return usuario;
}

export type CrearCompradorState = { error: string } | { ok: true } | null;

export async function crearComprador(
  _prevState: CrearCompradorState,
  formData: FormData
): Promise<CrearCompradorState> {
  const usuario = await requireUsuario();
  const db = createAdminClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const presupuestoMin = formData.get("presupuesto_min");
  const presupuestoMax = formData.get("presupuesto_max");
  const zonaBuscadaId = String(formData.get("zona_buscada_id") ?? "");

  const { data, error } = await db
    .from("compradores")
    .insert({
      tenant_id: usuario.tenant_id,
      agente_id: usuario.id,
      nombre,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      presupuesto_min: presupuestoMin ? Number(presupuestoMin) : null,
      presupuesto_max: presupuestoMax ? Number(presupuestoMax) : null,
      financiacion: String(formData.get("financiacion") ?? "") || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      zona_buscada_id: zonaBuscadaId || null,
      urgencia: String(formData.get("urgencia") ?? "media"),
      estado: "nuevo",
      notas: String(formData.get("notas") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: `No se pudo crear el comprador: ${error?.message}` };

  revalidatePath("/inmobiliaria/compradores");
  redirect(`/inmobiliaria/compradores/${data.id}`);
}

export type ActualizarCompradorState = { error: string } | { ok: true } | null;

export async function actualizarCompradorInmobiliaria(
  id: string,
  _prevState: ActualizarCompradorState,
  formData: FormData
): Promise<ActualizarCompradorState> {
  const usuario = await requireUsuario();
  const db = createAdminClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const gestor = esGestor(usuario.rol);
  const presupuestoMin = formData.get("presupuesto_min");
  const presupuestoMax = formData.get("presupuesto_max");
  const habitaciones = formData.get("habitaciones");
  const fechaProximaAccion = formData.get("fecha_proxima_accion");
  const fechaUltimoContacto = formData.get("fecha_ultimo_contacto");
  const zonaBuscadaId = String(formData.get("zona_buscada_id") ?? "");

  const { error } = await db
    .from("compradores")
    .update({
      nombre,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      presupuesto_min: presupuestoMin ? Number(presupuestoMin) : null,
      presupuesto_max: presupuestoMax ? Number(presupuestoMax) : null,
      habitaciones: habitaciones ? Number(habitaciones) : null,
      financiacion: String(formData.get("financiacion") ?? "") || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      zona_buscada_id: zonaBuscadaId || null,
      urgencia: String(formData.get("urgencia") ?? "") || null,
      fecha_proxima_accion: fechaProximaAccion ? String(fechaProximaAccion) : null,
      fecha_ultimo_contacto: fechaUltimoContacto ? String(fechaUltimoContacto) : null,
      notas: String(formData.get("notas") ?? "").trim() || null,
      ...(gestor && formData.get("agente_id") ? { agente_id: String(formData.get("agente_id")) } : {}),
    })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath(`/inmobiliaria/compradores/${id}`);
  revalidatePath("/inmobiliaria/compradores");
  return { ok: true };
}

export async function actualizarEstadoCompradorInmobiliaria(id: string, estado: string) {
  const usuario = await requireUsuario();
  const db = createAdminClient();

  await db
    .from("compradores")
    .update({ estado })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  await db.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "comprador",
    entidad_id: id,
    usuario_id: usuario.id,
    tipo: "cambio_estado",
    contenido: `Estado actualizado a: ${estado}`,
  });

  revalidatePath("/inmobiliaria/compradores");
}

export type NotaState = { error: string } | null;

export async function crearNotaComprador(
  compradorId: string,
  _prevState: NotaState,
  formData: FormData
): Promise<NotaState> {
  const usuario = await requireUsuario();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return { error: "Escribe algo antes de guardar." };

  const db = createAdminClient();
  const { error } = await db.from("actividades").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: "comprador",
    entidad_id: compradorId,
    usuario_id: usuario.id,
    tipo: "nota",
    contenido,
  });

  if (error) return { error: `No se pudo guardar la nota: ${error.message}` };

  revalidatePath(`/inmobiliaria/compradores/${compradorId}`);
  return null;
}

export type TareaState = { error: string } | null;

export async function crearTareaComprador(
  compradorId: string,
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
    entidad_tipo: "comprador",
    entidad_id: compradorId,
    asignado_a: usuario.id,
    titulo,
    fecha_vencimiento: fechaVencimiento ? String(fechaVencimiento) : null,
  });

  if (error) return { error: `No se pudo crear la tarea: ${error.message}` };

  revalidatePath(`/inmobiliaria/compradores/${compradorId}`);
  return null;
}

export async function alternarTareaComprador(
  tareaId: string,
  compradorId: string,
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

  revalidatePath(`/inmobiliaria/compradores/${compradorId}`);
}
