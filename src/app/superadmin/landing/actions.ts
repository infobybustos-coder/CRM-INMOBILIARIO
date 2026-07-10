"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type GuardarLandingState = { error: string } | { ok: true } | null;

const CAMPOS_LANDING = [
  "hero_titulo",
  "hero_subtitulo",
  "hero_cta_principal",
  "hero_cta_secundario",
  "badge_texto",
  "trust_1",
  "trust_2",
  "trust_3",
  "quick_asesor_titulo",
  "quick_asesor_descripcion",
  "quick_inmobiliaria_titulo",
  "quick_inmobiliaria_descripcion",
  "problema_titulo",
  "problema_1",
  "problema_2",
  "problema_3",
  "problema_4",
  "transicion_texto",
  "caracteristica_1_titulo",
  "caracteristica_1_descripcion",
  "caracteristica_2_titulo",
  "caracteristica_2_descripcion",
  "caracteristica_3_titulo",
  "caracteristica_3_descripcion",
  "modulo_titulo",
  "modulo_subtitulo",
  "modulo_1_titulo",
  "modulo_1_descripcion",
  "modulo_2_titulo",
  "modulo_2_descripcion",
  "modulo_3_titulo",
  "modulo_3_descripcion",
  "modulo_4_titulo",
  "modulo_4_descripcion",
  "modulo_5_titulo",
  "modulo_5_descripcion",
  "modulo_6_titulo",
  "modulo_6_descripcion",
  "pasos_titulo",
  "paso_1_titulo",
  "paso_1_descripcion",
  "paso_2_titulo",
  "paso_2_descripcion",
  "paso_3_titulo",
  "paso_3_descripcion",
  "planes_titulo",
  "planes_subtitulo",
  "faq_titulo",
  "faq_1_pregunta",
  "faq_1_respuesta",
  "faq_2_pregunta",
  "faq_2_respuesta",
  "faq_3_pregunta",
  "faq_3_respuesta",
  "faq_4_pregunta",
  "faq_4_respuesta",
  "faq_5_pregunta",
  "faq_5_respuesta",
  "cta_final_titulo",
  "cta_final_subtitulo",
] as const;

export async function guardarLandingConfig(
  _prev: GuardarLandingState,
  formData: FormData
): Promise<GuardarLandingState> {
  await requireSuperadmin();

  const campos: Record<string, string> = {};
  for (const campo of CAMPOS_LANDING) {
    const valor = String(formData.get(campo) ?? "").trim();
    if (!valor) return { error: "Ningún campo puede quedar vacío." };
    campos[campo] = valor;
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
