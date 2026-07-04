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
