"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  return usuario;
}

export type EventoState = { error: string } | null;

export async function crearEvento(
  _prevState: EventoState,
  formData: FormData
): Promise<EventoState> {
  const usuario = await requireUsuario();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "llamada");
  const fechaHora = String(formData.get("fecha_hora") ?? "");

  if (!titulo) return { error: "Pon un título." };
  if (!fechaHora) return { error: "Pon fecha y hora." };

  const supabase = await createClient();
  const { error } = await supabase.from("eventos_agenda").insert({
    tenant_id: usuario.tenant_id,
    usuario_id: usuario.id,
    tipo,
    titulo,
    fecha_hora: fechaHora,
  });

  if (error) return { error: "No se pudo crear el evento." };

  revalidatePath("/asesor/agenda");
  revalidatePath("/asesor");
  return null;
}

export async function actualizarEstadoEvento(id: string, estado: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("eventos_agenda")
    .update({ estado })
    .eq("id", id)
    .eq("usuario_id", usuario.id);

  revalidatePath("/asesor/agenda");
  revalidatePath("/asesor");
}
