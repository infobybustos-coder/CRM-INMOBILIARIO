import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LandingConfig = {
  heroTitulo: string;
  heroSubtitulo: string;
  heroCtaPrincipal: string;
  heroCtaSecundario: string;
  caracteristica1Titulo: string;
  caracteristica1Descripcion: string;
  caracteristica2Titulo: string;
  caracteristica2Descripcion: string;
  caracteristica3Titulo: string;
  caracteristica3Descripcion: string;
  ctaFinalTitulo: string;
  ctaFinalSubtitulo: string;
};

export const CONFIG_LANDING_POR_DEFECTO: LandingConfig = {
  heroTitulo: "Vende más inmuebles, con menos caos",
  heroSubtitulo:
    "El CRM pensado para asesores e inmobiliarias: propietarios, inmuebles, compradores, visitas y tu equipo, todo en un solo lugar. Empieza gratis, sin tarjeta de crédito.",
  heroCtaPrincipal: "Empieza gratis ahora",
  heroCtaSecundario: "Ver planes y precios",
  caracteristica1Titulo: "Deja el Excel y el WhatsApp atrás",
  caracteristica1Descripcion:
    "Propietarios, inmuebles, compradores y visitas organizados en un mismo sitio, siempre al día.",
  caracteristica2Titulo: "Trabaja en equipo, no en el caos",
  caracteristica2Descripcion:
    "Invita a tus asesores, reparte el trabajo y ve el rendimiento de cada uno en tiempo real.",
  caracteristica3Titulo: "Crece sin sustos",
  caracteristica3Descripcion:
    "Empieza gratis y pasa a PRO cuando lo necesites, sin límite de propietarios, inmuebles ni compradores.",
  ctaFinalTitulo: "¿Listo para dejar el caos atrás?",
  ctaFinalSubtitulo: "Únete gratis en menos de un minuto. Sin tarjeta, sin compromiso.",
};

export async function obtenerConfigLanding(): Promise<LandingConfig> {
  const supabase = await createClient();
  const { data } = await supabase.from("landing_config").select("*").eq("id", 1).maybeSingle();
  if (!data) return CONFIG_LANDING_POR_DEFECTO;

  return {
    heroTitulo: data.hero_titulo,
    heroSubtitulo: data.hero_subtitulo,
    heroCtaPrincipal: data.hero_cta_principal,
    heroCtaSecundario: data.hero_cta_secundario,
    caracteristica1Titulo: data.caracteristica_1_titulo,
    caracteristica1Descripcion: data.caracteristica_1_descripcion,
    caracteristica2Titulo: data.caracteristica_2_titulo,
    caracteristica2Descripcion: data.caracteristica_2_descripcion,
    caracteristica3Titulo: data.caracteristica_3_titulo,
    caracteristica3Descripcion: data.caracteristica_3_descripcion,
    ctaFinalTitulo: data.cta_final_titulo,
    ctaFinalSubtitulo: data.cta_final_subtitulo,
  };
}
