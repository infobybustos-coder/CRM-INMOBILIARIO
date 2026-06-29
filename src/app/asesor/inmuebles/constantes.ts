export { TIPOS_INMUEBLE, ETIQUETAS_TIPO_INMUEBLE } from "@/app/asesor/propietarios/constantes";

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

export type Zona = {
  id: string;
  nombre: string;
  ciudad: string | null;
};

export type PropietarioMini = {
  id: string;
  nombre: string;
};

export type Foto = {
  id: string;
  nombre_archivo: string;
  url_storage: string;
  creado_en: string;
};

export type Inmueble = {
  id: string;
  referencia: string | null;
  foto: string | null;
  direccion: string;
  zona_id: string | null;
  propietario_id: string | null;
  precio: number | null;
  metros_cuadrados: number | null;
  habitaciones: number | null;
  banos: number | null;
  tipo: string | null;
  estado: string;
  certificado_energetico: string | null;
  descripcion: string | null;
  fecha_publicacion: string | null;
  creado_en: string;
};
