"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");
  return usuario;
}

function revalidarSeguimiento() {
  revalidatePath("/asesor/seguimiento");
  revalidatePath("/asesor");
}

export async function marcarRealizada(id: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("eventos_agenda")
    .update({ estado: "completado" })
    .eq("id", id)
    .eq("usuario_id", usuario.id);

  revalidarSeguimiento();
}

export async function cancelarEvento(id: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("eventos_agenda")
    .update({ estado: "cancelado" })
    .eq("id", id)
    .eq("usuario_id", usuario.id);

  revalidarSeguimiento();
}

export async function reprogramarEvento(id: string, nuevaFechaHora: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("eventos_agenda")
    .update({ fecha_hora: nuevaFechaHora, estado: "pendiente" })
    .eq("id", id)
    .eq("usuario_id", usuario.id);

  revalidarSeguimiento();
}
