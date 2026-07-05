"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PerfilState = { error: string } | { ok: true } | null;

export async function actualizarPerfil(
  _prevState: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "Sesión expirada, vuelve a iniciar sesión." };

  const nombreCompleto = String(formData.get("nombre_completo") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;

  if (!nombreCompleto) return { error: "Pon tu nombre." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ nombre_completo: nombreCompleto, telefono, bio })
    .eq("id", usuario.id);

  if (error) return { error: "No se pudo guardar el perfil." };

  revalidatePath("/asesor", "layout");
  revalidatePath("/inmobiliaria", "layout");
  return { ok: true };
}

export async function actualizarAvatar(urlStorage: string) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");

  const supabase = await createClient();
  await supabase.from("usuarios").update({ avatar_url: urlStorage }).eq("id", usuario.id);

  revalidatePath("/asesor", "layout");
  revalidatePath("/inmobiliaria", "layout");
}
