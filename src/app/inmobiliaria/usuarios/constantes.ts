export type UsuarioFila = {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  activo: boolean;
  ultimoAcceso: string | null;
};

export const ETIQUETA_ROL: Record<string, string> = {
  admin: "Administrador",
  empleado: "Asesor",
};

export const COLOR_ROL: Record<string, string> = {
  admin: "bg-violet-500/10 text-violet-600",
  empleado: "bg-sky-500/10 text-sky-600",
};
