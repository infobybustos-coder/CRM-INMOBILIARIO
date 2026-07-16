export type EstadoConversacion = "abierta" | "en_proceso" | "esperando_respuesta" | "resuelta";
export type AutorTipo = "cliente" | "soporte";

export const ESTADOS_CONVERSACION: { valor: EstadoConversacion; etiqueta: string }[] = [
  { valor: "abierta", etiqueta: "Abierta" },
  { valor: "en_proceso", etiqueta: "En proceso" },
  { valor: "esperando_respuesta", etiqueta: "Esperando respuesta" },
  { valor: "resuelta", etiqueta: "Resuelta" },
];

export type AdjuntoNuevo = {
  nombreArchivo: string;
  urlStorage: string;
  tipoMime: string | null;
  tamanoBytes: number;
};

export type Adjunto = {
  id: string;
  nombreArchivo: string;
  urlStorage: string;
  tipoMime: string | null;
  urlFirmada?: string | null;
};

export type Mensaje = {
  id: string;
  autorTipo: AutorTipo;
  contenido: string | null;
  creadoEn: string;
  adjuntos: Adjunto[];
};

export type Conversacion = {
  id: string;
  asunto: string;
  estado: EstadoConversacion;
  creadoEn: string;
  actualizadoEn: string;
};

export type ConversacionConCliente = Conversacion & {
  tenantId: string;
  creadoPor: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string | null;
  clienteRol: string;
  tenantNombre: string;
  tenantTipoPlan: string;
  tenantPlanTarifa: string;
  tenantCreadoEn: string;
  clienteUltimoAcceso: string | null;
};
