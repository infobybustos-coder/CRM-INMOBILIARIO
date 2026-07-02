"use client";

import Link from "next/link";
import { calcularPrioridadComprador, calcularCompraScore } from "@/lib/prioridad";
import { ESTADOS_COMPRADOR, ETIQUETAS_ESTADO_COMPRADOR } from "@/app/asesor/compradores/constantes";
import { cn } from "@/lib/utils";

type Comprador = {
  id: string;
  nombre: string;
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  tipo_inmueble: string | null;
  zona_buscada_id: string | null;
  urgencia: string | null;
  estado: string;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  agente_id: string | null;
};

const PRIORIDAD_DOT: Record<string, string> = {
  alta: "bg-red-500",
  media: "bg-amber-400",
  baja: "bg-emerald-400",
};
const COL_COLOR: Record<string, string> = {
  nuevo: "border-sky-400/40",
  cualificado: "border-cyan-400/40",
  busqueda_activa: "border-blue-400/40",
  visitas: "border-violet-400/40",
  oferta: "border-orange-400/40",
  reserva: "border-amber-400/40",
  comprado: "border-emerald-400/40",
  perdido: "border-rose-400/40",
};
const COL_HEADER: Record<string, string> = {
  nuevo: "text-sky-600 dark:text-sky-400",
  cualificado: "text-cyan-600 dark:text-cyan-400",
  busqueda_activa: "text-blue-600 dark:text-blue-400",
  visitas: "text-violet-600 dark:text-violet-400",
  oferta: "text-orange-600 dark:text-orange-400",
  reserva: "text-amber-600 dark:text-amber-400",
  comprado: "text-emerald-600 dark:text-emerald-400",
  perdido: "text-rose-600 dark:text-rose-400",
};

function fmtEuro(n: number | null): string {
  if (!n) return "";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M €`;
  if (n >= 1000) return `${Math.round(n / 1000)}k €`;
  return `${n} €`;
}

function fmtProxima(fecha: string | null): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - hoy.getTime()) / 86400000);
  if (diff < 0) return `⚠ Hace ${Math.abs(diff)}d`;
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function KanbanCompradores({
  compradores,
  agentes,
  zonas,
  basePath = "/inmobiliaria/compradores",
}: {
  compradores: Comprador[];
  agentes: Record<string, string>;
  zonas: Record<string, string>;
  basePath?: string;
}) {
  const estados = ESTADOS_COMPRADOR.filter((e) => e !== "perdido");

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {estados.map((estado) => {
        const items = compradores.filter((c) => c.estado === estado);
        return (
          <div key={estado} className={cn("flex-shrink-0 w-60 rounded-xl border-2 bg-muted/20", COL_COLOR[estado])}>
            <div className="px-3 py-2.5 border-b">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-bold uppercase tracking-wide", COL_HEADER[estado])}>
                  {ETIQUETAS_ESTADO_COMPRADOR[estado]}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>
            </div>

            <div className="space-y-2 p-2">
              {items.map((c) => {
                const prioridad = calcularPrioridadComprador(c);
                const score = calcularCompraScore(c);
                const nombreAgente = c.agente_id ? (agentes[c.agente_id] ?? "").split(" ")[0] : null;
                const proxima = fmtProxima(c.fecha_proxima_accion);
                const esVencida = c.fecha_proxima_accion && new Date(c.fecha_proxima_accion) < new Date();
                const zona = c.zona_buscada_id ? zonas[c.zona_buscada_id] : null;

                return (
                  <Link
                    key={c.id}
                    href={`${basePath}/${c.id}`}
                    className="block rounded-lg border bg-card p-3 space-y-1.5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      {prioridad ? (
                        <div className="flex items-center gap-1.5">
                          <span className={cn("size-2 rounded-full", PRIORIDAD_DOT[prioridad])} />
                          <span className="text-[11px] font-medium text-muted-foreground capitalize">{prioridad}</span>
                        </div>
                      ) : <span />}
                      <span className="text-[11px] font-bold text-primary">🎯 {score}</span>
                    </div>

                    <p className="font-semibold leading-tight">{c.nombre}</p>

                    {(c.presupuesto_max || c.presupuesto_min) && (
                      <p className="text-xs font-medium text-muted-foreground">
                        💰 {fmtEuro(c.presupuesto_max ?? c.presupuesto_min)}
                      </p>
                    )}

                    {zona && <p className="text-xs text-muted-foreground">📍 {zona}</p>}

                    {proxima && (
                      <p className={cn("text-xs", esVencida ? "text-red-600 font-semibold dark:text-red-400" : "text-muted-foreground")}>
                        📅 {proxima}
                      </p>
                    )}

                    {nombreAgente && (
                      <p className="text-[11px] text-muted-foreground">👤 {nombreAgente}</p>
                    )}
                  </Link>
                );
              })}
              {items.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground/50">Sin registros</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
