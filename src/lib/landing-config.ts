import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LandingConfig = {
  heroTitulo: string;
  heroSubtitulo: string;
  heroCtaPrincipal: string;
  heroCtaSecundario: string;
  badgeTexto: string;
  trust1: string;
  trust2: string;
  trust3: string;
  quickAsesorTitulo: string;
  quickAsesorDescripcion: string;
  quickInmobiliariaTitulo: string;
  quickInmobiliariaDescripcion: string;
  problemaTitulo: string;
  problema1: string;
  problema2: string;
  problema3: string;
  problema4: string;
  transicionTexto: string;
  caracteristica1Titulo: string;
  caracteristica1Descripcion: string;
  caracteristica2Titulo: string;
  caracteristica2Descripcion: string;
  caracteristica3Titulo: string;
  caracteristica3Descripcion: string;
  moduloTitulo: string;
  moduloSubtitulo: string;
  modulo1Titulo: string;
  modulo1Descripcion: string;
  modulo2Titulo: string;
  modulo2Descripcion: string;
  modulo3Titulo: string;
  modulo3Descripcion: string;
  modulo4Titulo: string;
  modulo4Descripcion: string;
  modulo5Titulo: string;
  modulo5Descripcion: string;
  modulo6Titulo: string;
  modulo6Descripcion: string;
  pasosTitulo: string;
  paso1Titulo: string;
  paso1Descripcion: string;
  paso2Titulo: string;
  paso2Descripcion: string;
  paso3Titulo: string;
  paso3Descripcion: string;
  planesTitulo: string;
  planesSubtitulo: string;
  faqTitulo: string;
  faq1Pregunta: string;
  faq1Respuesta: string;
  faq2Pregunta: string;
  faq2Respuesta: string;
  faq3Pregunta: string;
  faq3Respuesta: string;
  faq4Pregunta: string;
  faq4Respuesta: string;
  faq5Pregunta: string;
  faq5Respuesta: string;
  ctaFinalTitulo: string;
  ctaFinalSubtitulo: string;
};

export const CONFIG_LANDING_POR_DEFECTO: LandingConfig = {
  heroTitulo: "Vende más inmuebles, con menos caos",
  heroSubtitulo:
    "El CRM pensado para asesores e inmobiliarias: propietarios, inmuebles, compradores, visitas y tu equipo, todo en un solo lugar. Empieza gratis, sin tarjeta de crédito.",
  heroCtaPrincipal: "Empieza gratis ahora",
  heroCtaSecundario: "Ver planes y precios",
  badgeTexto: "Software de gestión inmobiliaria",
  trust1: "Gratis para siempre en el plan básico",
  trust2: "Sin tarjeta de crédito",
  trust3: "Cancela cuando quieras",
  quickAsesorTitulo: "Soy asesor independiente",
  quickAsesorDescripcion: "Trabajo por mi cuenta y gestiono mi propio negocio.",
  quickInmobiliariaTitulo: "Tengo una inmobiliaria",
  quickInmobiliariaDescripcion: "Tengo un equipo de asesores que coordinar.",
  problemaTitulo: "¿Te suena esto?",
  problema1: "Los datos de tus propietarios están repartidos entre WhatsApp, notas y hojas de cálculo.",
  problema2: "No sabes qué inmuebles siguen disponibles sin llamar a alguien de tu equipo.",
  problema3: "Se te escapan compradores porque nadie hizo seguimiento a tiempo.",
  problema4: "No tienes ni idea de cuánto está vendiendo cada asesor.",
  transicionTexto: "Con Ambraio, todo eso desaparece.",
  caracteristica1Titulo: "Deja el Excel y el WhatsApp atrás",
  caracteristica1Descripcion:
    "Propietarios, inmuebles, compradores y visitas organizados en un mismo sitio, siempre al día.",
  caracteristica2Titulo: "Trabaja en equipo, no en el caos",
  caracteristica2Descripcion:
    "Invita a tus asesores, reparte el trabajo y ve el rendimiento de cada uno en tiempo real.",
  caracteristica3Titulo: "Crece sin sustos",
  caracteristica3Descripcion:
    "Empieza gratis y pasa a PRO cuando lo necesites, sin límite de propietarios, inmuebles ni compradores.",
  moduloTitulo: "Todo lo que necesitas, en un solo sitio",
  moduloSubtitulo: "Nada de herramientas sueltas ni suscripciones cruzadas.",
  modulo1Titulo: "Propietarios",
  modulo1Descripcion: "Capta y organiza a tus propietarios sin perder ni un contacto.",
  modulo2Titulo: "Inmuebles",
  modulo2Descripcion: "Toda tu cartera en un mismo sitio, con el estado siempre al día.",
  modulo3Titulo: "Compradores",
  modulo3Descripcion: "Haz seguimiento y no dejes escapar ninguna oportunidad.",
  modulo4Titulo: "Visitas y agenda",
  modulo4Descripcion: "Planifica visitas y tareas sin depender de la memoria.",
  modulo5Titulo: "Equipo",
  modulo5Descripcion: "Reparte el trabajo entre tus asesores y ve quién rinde más.",
  modulo6Titulo: "Rendimiento",
  modulo6Descripcion: "Métricas claras de tu negocio, sin montar una hoja de cálculo.",
  pasosTitulo: "Empieza en tres pasos",
  paso1Titulo: "Crea tu cuenta gratis",
  paso1Descripcion: "Sin tarjeta de crédito, en menos de un minuto.",
  paso2Titulo: "Añade tu cartera",
  paso2Descripcion: "Propietarios, inmuebles y compradores, todo en su sitio.",
  paso3Titulo: "Vende con orden",
  paso3Descripcion: "Haz seguimiento, reparte tareas y cierra más operaciones.",
  planesTitulo: "Planes claros, sin sorpresas",
  planesSubtitulo: "Empieza gratis. Sin permanencia — cambia o cancela cuando quieras.",
  faqTitulo: "Preguntas frecuentes",
  faq1Pregunta: "¿Necesito tarjeta de crédito para empezar?",
  faq1Respuesta: "No. El plan Gratis no pide tarjeta ni ningún compromiso de pago.",
  faq2Pregunta: "¿Puedo cancelar cuando quiera?",
  faq2Respuesta: "Sí, puedes volver al plan Gratis cuando quieras desde tu propia cuenta.",
  faq3Pregunta: "¿Sirve para un asesor independiente o solo para inmobiliarias?",
  faq3Respuesta: "Para ambos: hay un plan pensado específicamente para cada caso.",
  faq4Pregunta: "¿Mis datos están seguros y aislados de otras cuentas?",
  faq4Respuesta: "Sí. Cada cuenta tiene sus datos completamente separados y protegidos.",
  faq5Pregunta: "¿Qué pasa si supero el límite del plan Gratis?",
  faq5Respuesta:
    "Te lo indicamos claramente, y puedes pasar a PRO cuando quieras: sin límite de propietarios, inmuebles ni compradores.",
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
    badgeTexto: data.badge_texto ?? CONFIG_LANDING_POR_DEFECTO.badgeTexto,
    trust1: data.trust_1 ?? CONFIG_LANDING_POR_DEFECTO.trust1,
    trust2: data.trust_2 ?? CONFIG_LANDING_POR_DEFECTO.trust2,
    trust3: data.trust_3 ?? CONFIG_LANDING_POR_DEFECTO.trust3,
    quickAsesorTitulo: data.quick_asesor_titulo ?? CONFIG_LANDING_POR_DEFECTO.quickAsesorTitulo,
    quickAsesorDescripcion:
      data.quick_asesor_descripcion ?? CONFIG_LANDING_POR_DEFECTO.quickAsesorDescripcion,
    quickInmobiliariaTitulo:
      data.quick_inmobiliaria_titulo ?? CONFIG_LANDING_POR_DEFECTO.quickInmobiliariaTitulo,
    quickInmobiliariaDescripcion:
      data.quick_inmobiliaria_descripcion ?? CONFIG_LANDING_POR_DEFECTO.quickInmobiliariaDescripcion,
    problemaTitulo: data.problema_titulo ?? CONFIG_LANDING_POR_DEFECTO.problemaTitulo,
    problema1: data.problema_1 ?? CONFIG_LANDING_POR_DEFECTO.problema1,
    problema2: data.problema_2 ?? CONFIG_LANDING_POR_DEFECTO.problema2,
    problema3: data.problema_3 ?? CONFIG_LANDING_POR_DEFECTO.problema3,
    problema4: data.problema_4 ?? CONFIG_LANDING_POR_DEFECTO.problema4,
    transicionTexto: data.transicion_texto ?? CONFIG_LANDING_POR_DEFECTO.transicionTexto,
    caracteristica1Titulo: data.caracteristica_1_titulo,
    caracteristica1Descripcion: data.caracteristica_1_descripcion,
    caracteristica2Titulo: data.caracteristica_2_titulo,
    caracteristica2Descripcion: data.caracteristica_2_descripcion,
    caracteristica3Titulo: data.caracteristica_3_titulo,
    caracteristica3Descripcion: data.caracteristica_3_descripcion,
    moduloTitulo: data.modulo_titulo ?? CONFIG_LANDING_POR_DEFECTO.moduloTitulo,
    moduloSubtitulo: data.modulo_subtitulo ?? CONFIG_LANDING_POR_DEFECTO.moduloSubtitulo,
    modulo1Titulo: data.modulo_1_titulo ?? CONFIG_LANDING_POR_DEFECTO.modulo1Titulo,
    modulo1Descripcion: data.modulo_1_descripcion ?? CONFIG_LANDING_POR_DEFECTO.modulo1Descripcion,
    modulo2Titulo: data.modulo_2_titulo ?? CONFIG_LANDING_POR_DEFECTO.modulo2Titulo,
    modulo2Descripcion: data.modulo_2_descripcion ?? CONFIG_LANDING_POR_DEFECTO.modulo2Descripcion,
    modulo3Titulo: data.modulo_3_titulo ?? CONFIG_LANDING_POR_DEFECTO.modulo3Titulo,
    modulo3Descripcion: data.modulo_3_descripcion ?? CONFIG_LANDING_POR_DEFECTO.modulo3Descripcion,
    modulo4Titulo: data.modulo_4_titulo ?? CONFIG_LANDING_POR_DEFECTO.modulo4Titulo,
    modulo4Descripcion: data.modulo_4_descripcion ?? CONFIG_LANDING_POR_DEFECTO.modulo4Descripcion,
    modulo5Titulo: data.modulo_5_titulo ?? CONFIG_LANDING_POR_DEFECTO.modulo5Titulo,
    modulo5Descripcion: data.modulo_5_descripcion ?? CONFIG_LANDING_POR_DEFECTO.modulo5Descripcion,
    modulo6Titulo: data.modulo_6_titulo ?? CONFIG_LANDING_POR_DEFECTO.modulo6Titulo,
    modulo6Descripcion: data.modulo_6_descripcion ?? CONFIG_LANDING_POR_DEFECTO.modulo6Descripcion,
    pasosTitulo: data.pasos_titulo ?? CONFIG_LANDING_POR_DEFECTO.pasosTitulo,
    paso1Titulo: data.paso_1_titulo ?? CONFIG_LANDING_POR_DEFECTO.paso1Titulo,
    paso1Descripcion: data.paso_1_descripcion ?? CONFIG_LANDING_POR_DEFECTO.paso1Descripcion,
    paso2Titulo: data.paso_2_titulo ?? CONFIG_LANDING_POR_DEFECTO.paso2Titulo,
    paso2Descripcion: data.paso_2_descripcion ?? CONFIG_LANDING_POR_DEFECTO.paso2Descripcion,
    paso3Titulo: data.paso_3_titulo ?? CONFIG_LANDING_POR_DEFECTO.paso3Titulo,
    paso3Descripcion: data.paso_3_descripcion ?? CONFIG_LANDING_POR_DEFECTO.paso3Descripcion,
    planesTitulo: data.planes_titulo ?? CONFIG_LANDING_POR_DEFECTO.planesTitulo,
    planesSubtitulo: data.planes_subtitulo ?? CONFIG_LANDING_POR_DEFECTO.planesSubtitulo,
    faqTitulo: data.faq_titulo ?? CONFIG_LANDING_POR_DEFECTO.faqTitulo,
    faq1Pregunta: data.faq_1_pregunta ?? CONFIG_LANDING_POR_DEFECTO.faq1Pregunta,
    faq1Respuesta: data.faq_1_respuesta ?? CONFIG_LANDING_POR_DEFECTO.faq1Respuesta,
    faq2Pregunta: data.faq_2_pregunta ?? CONFIG_LANDING_POR_DEFECTO.faq2Pregunta,
    faq2Respuesta: data.faq_2_respuesta ?? CONFIG_LANDING_POR_DEFECTO.faq2Respuesta,
    faq3Pregunta: data.faq_3_pregunta ?? CONFIG_LANDING_POR_DEFECTO.faq3Pregunta,
    faq3Respuesta: data.faq_3_respuesta ?? CONFIG_LANDING_POR_DEFECTO.faq3Respuesta,
    faq4Pregunta: data.faq_4_pregunta ?? CONFIG_LANDING_POR_DEFECTO.faq4Pregunta,
    faq4Respuesta: data.faq_4_respuesta ?? CONFIG_LANDING_POR_DEFECTO.faq4Respuesta,
    faq5Pregunta: data.faq_5_pregunta ?? CONFIG_LANDING_POR_DEFECTO.faq5Pregunta,
    faq5Respuesta: data.faq_5_respuesta ?? CONFIG_LANDING_POR_DEFECTO.faq5Respuesta,
    ctaFinalTitulo: data.cta_final_titulo,
    ctaFinalSubtitulo: data.cta_final_subtitulo,
  };
}
