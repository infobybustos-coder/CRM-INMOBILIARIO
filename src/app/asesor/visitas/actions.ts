"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  return usuario;
}

function revalidarVisitas() {
  revalidatePath("/asesor/visitas");
  revalidatePath("/asesor/agenda");
  revalidatePath("/asesor");
}

export type CrearVisitaState = { error: string } | { ok: true } | null;

export async function crearVisita(
  _prevState: CrearVisitaState,
  formData: FormData
): Promise<CrearVisitaState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const inmuebleId = String(formData.get("inmueble_id") ?? "").trim();
  const compradorId = String(formData.get("comprador_id") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();

  if (!inmuebleId || !compradorId || !fecha || !hora) {
    return { error: "Selecciona inmueble, comprador, fecha y hora." };
  }

  const [{ data: inmueble }, { data: comprador }] = await Promise.all([
    supabase.from("inmuebles").select("direccion").eq("id", inmuebleId).eq("agente_id", usuario.id).single(),
    supabase.from("compradores").select("nombre").eq("id", compradorId).eq("agente_id", usuario.id).single(),
  ]);

  if (!inmueble || !comprador) {
    return { error: "No se encontró el inmueble o el comprador." };
  }

  const { error } = await supabase.from("eventos_agenda").insert({
    tenant_id: usuario.tenant_id,
    usuario_id: usuario.id,
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
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("eventos_agenda")
    .update({ confirmado })
    .eq("id", id)
    .eq("usuario_id", usuario.id);

  revalidarVisitas();
}

export async function actualizarEstadoVisita(id: string, estado: "completado" | "cancelado" | "pendiente") {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("eventos_agenda")
    .update({ estado })
    .eq("id", id)
    .eq("usuario_id", usuario.id);

  revalidarVisitas();
}
