"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AjustesState = { error: string } | { ok: true } | null;

export async function actualizarAjustes(
  _prevState: AjustesState,
  formData: FormData
): Promise<AjustesState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "Sesión expirada, vuelve a iniciar sesión." };

  const moneda = String(formData.get("moneda") ?? "EUR");
  const idioma = String(formData.get("idioma") ?? "es");

  if (!["EUR", "USD"].includes(moneda)) return { error: "Moneda no válida." };
  if (!["es", "en"].includes(idioma)) return { error: "Idioma no válido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ moneda, idioma })
    .eq("id", usuario.id);

  if (error) return { error: "No se pudieron guardar los ajustes." };

  revalidatePath("/asesor", "layout");
  return { ok: true };
}
