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

export const ETIQUETAS_ESTADO: Record<string, string> = {
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

export type Propietario = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  whatsapp: string | null;
  direccion: string | null;
  tipo_inmueble: string | null;
  estado: string;
  valor_estimado: number | null;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  notas: string | null;
  creado_en: string;
};
