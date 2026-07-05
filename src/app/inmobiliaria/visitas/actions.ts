"use server";

import { revalidatePath } from "next/cache";
import { requireInmobiliaria, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function revalidarVisitas() {
  revalidatePath("/inmobiliaria/visitas");
  revalidatePath("/inmobiliaria/mis-visitas");
  revalidatePath("/inmobiliaria");
  revalidatePath("/inmobiliaria/agenda");
  revalidatePath("/inmobiliaria/mi-agenda");
}

export type CrearVisitaState = { error: string } | { ok: true } | null;

export async function crearVisita(
  _prevState: CrearVisitaState,
  formData: FormData
): Promise<CrearVisitaState> {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  const inmuebleId = String(formData.get("inmueble_id") ?? "").trim();
  const compradorId = String(formData.get("comprador_id") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();
  // Un empleado siempre se asigna la visita a sí mismo; solo un gestor puede
  // elegir a otro asesor (o dejarla sin asignar) desde el selector.
  const asesorId = esGestor(usuario.rol)
    ? String(formData.get("asesor_id") ?? "").trim() || null
    : usuario.id;

  if (!inmuebleId || !compradorId || !fecha || !hora) {
    return { error: "Selecciona inmueble, comprador, fecha y hora." };
  }

  const [{ data: inmueble }, { data: comprador }] = await Promise.all([
    supabase
      .from("inmuebles")
      .select("direccion")
      .eq("id", inmuebleId)
      .eq("tenant_id", usuario.tenant_id)
      .single(),
    supabase
      .from("compradores")
      .select("nombre")
      .eq("id", compradorId)
      .eq("tenant_id", usuario.tenant_id)
      .single(),
  ]);

  if (!inmueble || !comprador) {
    return { error: "No se encontró el inmueble o el comprador." };
  }

  const { error } = await supabase.from("eventos_agenda").insert({
    tenant_id: usuario.tenant_id,
    usuario_id: asesorId,
    entidad_tipo: "inmueble",
    entidad_id: inmuebleId,
    inmueble_id: inmuebleId,
    comprador_id: compradorId,
    tipo: "visita",
    titulo: `Visita: ${inmueble.direccion} con ${comprador.nombre}`,
    fecha_hora: `${fecha}T${hora}`,
  });

  if (error) return { error: "No se pudo crear la visita." };

  revalidarVisitas();
  return { ok: true };
}

export async function confirmarVisita(id: string, confirmado: boolean) {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  let query = supabase
    .from("eventos_agenda")
    .update({ confirmado })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);
  if (!esGestor(usuario.rol)) query = query.eq("usuario_id", usuario.id);
  await query;

  revalidarVisitas();
}

export async function actualizarEstadoVisita(id: string, estado: "completado" | "cancelado" | "pendiente") {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  let query = supabase
    .from("eventos_agenda")
    .update({ estado })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);
  if (!esGestor(usuario.rol)) query = query.eq("usuario_id", usuario.id);
  await query;

  revalidarVisitas();
}
