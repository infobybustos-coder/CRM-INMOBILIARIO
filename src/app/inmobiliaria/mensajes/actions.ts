"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  return usuario;
}

export type EnviarMensajeState = { error: string } | { ok: true } | null;

export async function enviarMensaje(
  _prevState: EnviarMensajeState,
  formData: FormData
): Promise<EnviarMensajeState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const receptorId = String(formData.get("receptor_id") ?? "").trim();
  const contenido = String(formData.get("contenido") ?? "").trim();

  if (!receptorId) return { error: "Selecciona un destinatario." };
  if (!contenido) return { error: "Escribe un mensaje." };
  if (receptorId === usuario.id) return { error: "No puedes enviarte mensajes a ti mismo." };

  const { error } = await supabase.from("mensajes_internos").insert({
    tenant_id: usuario.tenant_id,
    emisor_id: usuario.id,
    receptor_id: receptorId,
    contenido,
  });

  if (error) return { error: "No se pudo enviar el mensaje." };

  revalidatePath("/inmobiliaria/mensajes");
  return { ok: true };
}

export async function marcarLeido(mensajeId: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  await supabase
    .from("mensajes_internos")
    .update({ leido: true })
    .eq("id", mensajeId)
    .eq("receptor_id", usuario.id);

  revalidatePath("/inmobiliaria/mensajes");
}
