"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SoporteState = { error: string } | null;

export async function enviarMensajeSoporte(
  _prevState: SoporteState,
  formData: FormData
): Promise<SoporteState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "Sesión expirada, vuelve a iniciar sesión." };

  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return { error: "Escribe tu mensaje." };

  const supabase = await createClient();
  const { error } = await supabase.from("mensajes_soporte").insert({
    tenant_id: usuario.tenant_id,
    usuario_id: usuario.id,
    remitente: "asesor",
    contenido,
  });

  if (error) return { error: "No se pudo enviar el mensaje." };

  revalidatePath("/asesor/soporte");
  return null;
}
