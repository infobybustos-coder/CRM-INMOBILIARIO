"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type GuardarLandingState = { error: string } | { ok: true } | null;

function texto(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor || null;
}

export async function guardarLandingConfig(
  _prev: GuardarLandingState,
  formData: FormData
): Promise<GuardarLandingState> {
  await requireSuperadmin();

  const campos = {
    hero_titulo: texto(formData, "hero_titulo"),
    hero_subtitulo: texto(formData, "hero_subtitulo"),
    hero_cta_principal: texto(formData, "hero_cta_principal"),
    hero_cta_secundario: texto(formData, "hero_cta_secundario"),
    caracteristica_1_titulo: texto(formData, "caracteristica_1_titulo"),
    caracteristica_1_descripcion: texto(formData, "caracteristica_1_descripcion"),
    caracteristica_2_titulo: texto(formData, "caracteristica_2_titulo"),
    caracteristica_2_descripcion: texto(formData, "caracteristica_2_descripcion"),
    caracteristica_3_titulo: texto(formData, "caracteristica_3_titulo"),
    caracteristica_3_descripcion: texto(formData, "caracteristica_3_descripcion"),
    cta_final_titulo: texto(formData, "cta_final_titulo"),
    cta_final_subtitulo: texto(formData, "cta_final_subtitulo"),
  };

  if (Object.values(campos).some((v) => v === null)) {
    return { error: "Ningún campo puede quedar vacío." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("landing_config")
    .update({ ...campos, actualizado_en: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath("/superadmin/landing");
  revalidatePath("/");
  return { ok: true };
}
