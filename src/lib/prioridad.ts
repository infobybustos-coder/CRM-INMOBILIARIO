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

function nivelPorContacto(fechaProximaAccion: string | null, fechaUltimoContacto: string | null): Prioridad {
  const vencida = estaVencida(fechaProximaAccion);
  const diasSinContacto = diasDesde(fechaUltimoContacto);
  const sinContactarNunca = diasSinContacto === null;

  if (vencida || sinContactarNunca || (diasSinContacto ?? 0) >= 7) return "alta";
  if ((diasSinContacto ?? 0) >= 3) return "media";
  return "baja";
}

export function calcularPrioridad(p: PropietarioParaPrioridad): Prioridad {
  if (p.estado === "captado" || p.estado === "perdido") return null;
  return nivelPorContacto(p.fecha_proxima_accion, p.fecha_ultimo_contacto);
}

export function calcularCaptacionScore(p: PropietarioParaPrioridad): number {
  let score = PESO_ESTADO[p.estado] ?? 0;

  if (p.fuente_lead === "referido") score += 10;
  if (p.valor_estimado) score += 5;
  if (estaVencida(p.fecha_proxima_accion)) score -= 10;

  return Math.max(0, Math.min(100, score));
}

type CompradorParaPrioridad = {
  estado: string;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  urgencia?: string | null;
  presupuesto_max?: number | null;
};

const PESO_ESTADO_COMPRADOR: Record<string, number> = {
  nuevo: 10,
  cualificado: 25,
  busqueda_activa: 45,
  visitas: 60,
  oferta: 75,
  reserva: 90,
  comprado: 100,
  perdido: 0,
};

export function calcularPrioridadComprador(c: CompradorParaPrioridad): Prioridad {
  if (c.estado === "comprado" || c.estado === "perdido") return null;
  return nivelPorContacto(c.fecha_proxima_accion, c.fecha_ultimo_contacto);
}

export function calcularCompraScore(c: CompradorParaPrioridad): number {
  let score = PESO_ESTADO_COMPRADOR[c.estado] ?? 0;

  if (c.urgencia === "alta") score += 10;
  if (c.presupuesto_max) score += 5;
  if (estaVencida(c.fecha_proxima_accion)) score -= 10;

  return Math.max(0, Math.min(100, score));
}
