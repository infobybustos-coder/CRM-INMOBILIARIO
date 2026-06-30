export type AgendaItem = {
  id: string;
  origen: "evento" | "tarea";
  titulo: string;
  fecha: string;
  estado: string;
  tipo?: string;
};

export function claveDia(fecha: string | Date): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function agruparPorDia(items: AgendaItem[]): Record<string, AgendaItem[]> {
  const mapa: Record<string, AgendaItem[]> = {};
  for (const item of items) {
    const clave = claveDia(item.fecha);
    if (!mapa[clave]) mapa[clave] = [];
    mapa[clave].push(item);
  }
  for (const clave in mapa) {
    mapa[clave].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }
  return mapa;
}

function estaPendiente(item: AgendaItem): boolean {
  return item.estado !== "completado" && item.estado !== "completada" && item.estado !== "cancelado";
}

export function itemsDeHoy(items: AgendaItem[]): AgendaItem[] {
  const claveHoy = claveDia(new Date());
  return items.filter((i) => estaPendiente(i) && claveDia(i.fecha) === claveHoy);
}

export function itemsVencidos(items: AgendaItem[]): AgendaItem[] {
  const ahora = new Date();
  const claveHoy = claveDia(ahora);
  return items.filter(
    (i) => estaPendiente(i) && new Date(i.fecha) < ahora && claveDia(i.fecha) !== claveHoy
  );
}
