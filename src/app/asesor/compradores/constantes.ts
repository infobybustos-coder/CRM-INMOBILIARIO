export { TIPOS_INMUEBLE, ETIQUETAS_TIPO_INMUEBLE } from "@/app/asesor/propietarios/constantes";

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

export type Zona = {
  id: string;
  nombre: string;
  ciudad: string | null;
};

export type Comprador = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  financiacion: string | null;
  tipo_inmueble: string | null;
  zona_buscada_id: string | null;
  habitaciones: number | null;
  urgencia: string;
  estado: string;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  notas: string | null;
  creado_en: string;
};
