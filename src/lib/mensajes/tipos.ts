export type EntidadCompartible = "inmueble" | "propietario" | "comprador" | "visita" | "tarea";

export type Adjunto = {
  id: string;
  nombreArchivo: string;
  urlStorage: string;
  tipoMime: string | null;
  urlFirmada?: string | null;
};

export type AdjuntoNuevo = {
  nombreArchivo: string;
  urlStorage: string;
  tipoMime: string | null;
  tamanoBytes: number;
};

export type TarjetaRef = {
  id: string;
  entidadTipo: EntidadCompartible;
  entidadId: string;
  datos: DatosTarjeta;
};

export type Mensaje = {
  id: string;
  autorId: string;
  contenido: string | null;
  creadoEn: string;
  adjuntos: Adjunto[];
  tarjetas: TarjetaRef[];
};

export type Conversacion = {
  id: string;
  entidadTipo: EntidadCompartible | null;
  entidadId: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type ConversacionConParticipante = Conversacion & {
  entidadTitulo: string | null;
  otroUsuarioId: string;
  otroNombre: string;
  otroAvatarUrl: string | null;
  otroUltimaActividad: string | null;
  ultimoMensaje: string | null;
  ultimoMensajeEn: string | null;
  sinLeer: boolean;
  miUltimaLectura: string | null;
  otraUltimaLectura: string | null;
};

export type ResultadoBusqueda = {
  entidadTipo: EntidadCompartible;
  entidadId: string;
  titulo: string;
  subtitulo: string;
};

export type Companero = {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  avatarUrl: string | null;
  ultimaActividad: string | null;
};

// Datos en vivo para renderizar una tarjeta (cabecera fija o inline).
export type DatosTarjeta =
  | { disponible: false; entidadTipo: EntidadCompartible; entidadId: string }
  | {
      disponible: true;
      entidadTipo: "inmueble";
      entidadId: string;
      href: string;
      imagenUrl: string | null;
      direccion: string;
      referencia: string | null;
      precio: number | null;
      estado: string;
    }
  | {
      disponible: true;
      entidadTipo: "propietario";
      entidadId: string;
      href: string;
      nombre: string;
      telefono: string | null;
      estado: string;
    }
  | {
      disponible: true;
      entidadTipo: "comprador";
      entidadId: string;
      href: string;
      nombre: string;
      presupuestoMax: number | null;
      estado: string;
    }
  | {
      disponible: true;
      entidadTipo: "visita";
      entidadId: string;
      href: string | null;
      fechaHora: string;
      estado: string;
      subtitulo: string;
    }
  | {
      disponible: true;
      entidadTipo: "tarea";
      entidadId: string;
      href: string;
      titulo: string;
      fechaVencimiento: string | null;
      estado: string;
    };
