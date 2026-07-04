export type AgenteFila = {
  id: string;
  nombreCompleto: string;
  email: string;
  activoHoy: boolean;
  totalPropietarios: number;
  totalCompradores: number;
  tareasPendientes: number;
  ultimaActividad: string | null;
};
