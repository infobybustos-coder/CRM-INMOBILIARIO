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
  heroTitulo: "El CRM que tu inmobiliaria necesita para vender más, sin caos",
  heroSubtitulo:
    "Gestiona propietarios, inmuebles, compradores y tu equipo desde un solo sitio. Empieza gratis, sin tarjeta de crédito.",
  heroCtaPrincipal: "Empieza gratis",
  heroCtaSecundario: "Ver planes y precios",
  caracteristica1Titulo: "Todo en un solo lugar",
  caracteristica1Descripcion:
    "Propietarios, inmuebles, compradores y visitas organizados, sin hojas de cálculo ni WhatsApp perdido.",
  caracteristica2Titulo: "Trabaja en equipo",
  caracteristica2Descripcion:
    "Invita a tus asesores, reparte el trabajo y ve el rendimiento de cada uno en tiempo real.",
  caracteristica3Titulo: "Crece a tu ritmo",
  caracteristica3Descripcion:
    "Empieza gratis y pasa a PRO cuando lo necesites, sin límite de propietarios, inmuebles ni compradores.",
  ctaFinalTitulo: "¿Listo para ordenar tu negocio?",
  ctaFinalSubtitulo: "Crea tu cuenta en menos de un minuto. Sin compromiso.",
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
