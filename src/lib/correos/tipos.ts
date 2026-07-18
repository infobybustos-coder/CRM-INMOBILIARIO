export const CLAVES_PLANTILLA = [
  "bienvenida",
  "bienvenida_colaborador",
  "limite_aviso",
  "limite_alcanzado",
  "recuperar_password",
  "password_cambiada",
  "cambio_plan",
  "cancelacion_plan",
  "verificacion_email",
] as const;

export type ClavePlantilla = (typeof CLAVES_PLANTILLA)[number];

export function esClavePlantilla(valor: string): valor is ClavePlantilla {
  return (CLAVES_PLANTILLA as readonly string[]).includes(valor);
}

export type PlantillaEmail = {
  id: string;
  clave: ClavePlantilla;
  nombre: string;
  descripcion: string | null;
  asunto: string;
  contenidoHtml: string;
  botonTexto: string | null;
  botonUrl: string | null;
  variablesDisponibles: string[];
  activo: boolean;
  actualizadoEn: string;
};

export type ConfigCorreos = {
  colorPrincipal: string;
  logoUrl: string | null;
  firma: string;
  remitenteNombre: string;
  remitenteEmail: string;
};

export type VariablesCorreo = Record<string, string>;

export type ResultadoEnvio = { ok: true; omitido?: true } | { error: string };

export type EstadoEnvioCorreo = "enviado" | "fallido" | "omitido";

export type RegistroCorreo = {
  id: string;
  plantillaClave: string;
  destinatario: string;
  asunto: string;
  variables: VariablesCorreo;
  estado: EstadoEnvioCorreo;
  error: string | null;
  esReenvio: boolean;
  reenviadoPor: string | null;
  creadoEn: string;
};
