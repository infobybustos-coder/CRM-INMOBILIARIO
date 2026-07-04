export const ETIQUETA_PRIORIDAD: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500/10 text-red-600",
  media: "bg-amber-500/10 text-amber-600",
  baja: "bg-muted text-muted-foreground",
};

export const ETIQUETA_ESTADO_TAREA: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const COLOR_ESTADO_TAREA: Record<string, string> = {
  pendiente: "bg-amber-500/10 text-amber-600",
  en_progreso: "bg-sky-500/10 text-sky-600",
  completada: "bg-emerald-500/10 text-emerald-600",
  cancelada: "bg-rose-500/10 text-rose-600",
};

export const ETIQUETA_ENTIDAD: Record<string, string> = {
  propietario: "Propietario",
  comprador: "Comprador",
  inmueble: "Inmueble",
};

export const COLOR_ENTIDAD: Record<string, string> = {
  propietario: "bg-blue-500/10 text-blue-600",
  comprador: "bg-violet-500/10 text-violet-600",
  inmueble: "bg-teal-500/10 text-teal-600",
};

export const BORDE_ENTIDAD: Record<string, string> = {
  propietario: "border-l-blue-500/60",
  comprador: "border-l-violet-500/60",
  inmueble: "border-l-teal-500/60",
};
