// Constantes exclusivas del módulo inmobiliaria (admin). No mezclar con /asesor.

export const ESTADOS_PROPIETARIO = [
  "nuevo_lead",
  "contactado",
  "tasacion_programada",
  "tasacion_realizada",
  "negociacion",
  "exclusiva_firmada",
  "captado",
  "perdido",
] as const;

export const ETIQUETAS_ESTADO_PROPIETARIO: Record<string, string> = {
  nuevo_lead: "Nuevo lead",
  contactado: "Contactado",
  tasacion_programada: "Tasación programada",
  tasacion_realizada: "Tasación realizada",
  negociacion: "Negociación",
  exclusiva_firmada: "Exclusiva firmada",
  captado: "Captado",
  perdido: "Perdido",
};

export const TIPOS_INMUEBLE = [
  "piso",
  "casa",
  "chalet",
  "atico",
  "duplex",
  "local",
  "oficina",
  "garaje",
  "terreno",
  "nave",
  "otro",
] as const;

export const ETIQUETAS_TIPO_INMUEBLE: Record<string, string> = {
  piso: "Piso",
  casa: "Casa",
  chalet: "Chalet",
  atico: "Ático",
  duplex: "Dúplex",
  local: "Local",
  oficina: "Oficina",
  garaje: "Garaje",
  terreno: "Terreno",
  nave: "Nave",
  otro: "Otro",
};

export const FUENTES_LEAD = [
  "referido",
  "portal_inmobiliario",
  "redes_sociales",
  "puerta_fria",
  "web",
  "llamada_entrante",
  "otro",
] as const;

export const ETIQUETAS_FUENTE_LEAD: Record<string, string> = {
  referido: "Referido",
  portal_inmobiliario: "Portal inmobiliario",
  redes_sociales: "Redes sociales",
  puerta_fria: "Puerta fría",
  web: "Web",
  llamada_entrante: "Llamada entrante",
  otro: "Otro",
};

export const ESTADOS_COMPRADOR = [
  "nuevo",
  "cualificado",
  "busqueda_activa",
  "visitas",
  "oferta",
  "reserva",
  "comprado",
  "perdido",
] as const;

export const ETIQUETAS_ESTADO_COMPRADOR: Record<string, string> = {
  nuevo: "Nuevo",
  cualificado: "Cualificado",
  busqueda_activa: "Búsqueda activa",
  visitas: "Visitas",
  oferta: "Oferta",
  reserva: "Reserva",
  comprado: "Comprado",
  perdido: "Perdido",
};

export const NIVELES_URGENCIA = ["baja", "media", "alta"] as const;

export const ETIQUETAS_URGENCIA: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const TIPOS_FINANCIACION = ["hipoteca", "contado", "mixta", "pendiente_estudio"] as const;

export const ETIQUETAS_FINANCIACION: Record<string, string> = {
  hipoteca: "Hipoteca",
  contado: "Al contado",
  mixta: "Mixta",
  pendiente_estudio: "Pendiente de estudio",
};

export const ESTADOS_INMUEBLE = [
  "captacion",
  "preparacion",
  "publicado",
  "visitas",
  "oferta",
  "reservado",
  "vendido",
] as const;

export const ETIQUETAS_ESTADO_INMUEBLE: Record<string, string> = {
  captacion: "Captación",
  preparacion: "Preparación",
  publicado: "Publicado",
  visitas: "Visitas",
  oferta: "Oferta",
  reservado: "Reservado",
  vendido: "Vendido",
};

export const TIPOS_DOCUMENTO = [
  "dni",
  "nota_simple",
  "cert_energetico",
  "ite",
  "escritura",
  "cedula_habitabilidad",
  "foto",
  "plano",
  "contrato",
  "otro",
] as const;

export const ETIQUETAS_TIPO_DOCUMENTO: Record<string, string> = {
  dni: "DNI",
  nota_simple: "Nota simple",
  cert_energetico: "Certificado energético",
  ite: "ITE",
  escritura: "Escritura",
  cedula_habitabilidad: "Cédula de habitabilidad",
  foto: "Foto",
  plano: "Plano",
  contrato: "Contrato",
  otro: "Otro",
};
