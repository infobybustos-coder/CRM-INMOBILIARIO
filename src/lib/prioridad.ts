type PropietarioParaPrioridad = {
  estado: string;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  valor_estimado: number | null;
  fuente_lead?: string | null;
};

const PESO_ESTADO: Record<string, number> = {
  nuevo_lead: 10,
  contactado: 25,
  tasacion_programada: 40,
  tasacion_realizada: 55,
  negociacion: 70,
  exclusiva_firmada: 95,
  captado: 100,
  perdido: 0,
};

export type Prioridad = "alta" | "media" | "baja" | null;

export function diasDesde(fecha: string | null): number | null {
  if (!fecha) return null;
  const ms = Date.now() - new Date(fecha).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function estaVencida(fecha: string | null): boolean {
  if (!fecha) return false;
  return new Date(fecha) < new Date();
}

export function calcularPrioridad(p: PropietarioParaPrioridad): Prioridad {
  if (p.estado === "captado" || p.estado === "perdido") return null;

  const vencida = estaVencida(p.fecha_proxima_accion);
  const diasSinContacto = diasDesde(p.fecha_ultimo_contacto);
  const sinContactarNunca = diasSinContacto === null;

  if (vencida || sinContactarNunca || (diasSinContacto ?? 0) >= 7) return "alta";
  if ((diasSinContacto ?? 0) >= 3) return "media";
  return "baja";
}

export function calcularCaptacionScore(p: PropietarioParaPrioridad): number {
  let score = PESO_ESTADO[p.estado] ?? 0;

  if (p.fuente_lead === "referido") score += 10;
  if (p.valor_estimado) score += 5;
  if (estaVencida(p.fecha_proxima_accion)) score -= 10;

  return Math.max(0, Math.min(100, score));
}
