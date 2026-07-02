"use client";

import Link from "next/link";
import { calcularPrioridad, calcularCaptacionScore, diasDesde } from "@/lib/prioridad";
import {
  ESTADOS_PROPIETARIO,
  ETIQUETAS_ESTADO,
} from "@/app/asesor/propietarios/constantes";
import { cn } from "@/lib/utils";

type Propietario = {
  id: string;
  nombre: string;
  direccion: string | null;
  estado: string;
  valor_estimado: number | null;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  fuente_lead: string | null;
  agente_id: string | null;
  guion_captacion: unknown;
  notas: string | null;
};

const PRIORIDAD_DOT: Record<string, string> = {
  alta: "bg-red-500",
  media: "bg-amber-400",
  baja: "bg-emerald-400",
};
const PRIORIDAD_LABEL: Record<string, string> = { alta: "Alta", media: "Media", baja: "Baja" };

const COL_COLOR: Record<string, string> = {
  nuevo_lead: "border-sky-400/40",
  contactado: "border-cyan-400/40",
  tasacion_programada: "border-amber-400/40",
  tasacion_realizada: "border-orange-400/40",
  negociacion: "border-violet-400/40",
  exclusiva_firmada: "border-indigo-400/40",
  captado: "border-emerald-400/40",
  perdido: "border-rose-400/40",
};
const COL_HEADER: Record<string, string> = {
  nuevo_lead: "text-sky-600 dark:text-sky-400",
  contactado: "text-cyan-600 dark:text-cyan-400",
  tasacion_programada: "text-amber-600 dark:text-amber-400",
  tasacion_realizada: "text-orange-600 dark:text-orange-400",
  negociacion: "text-violet-600 dark:text-violet-400",
  exclusiva_firmada: "text-indigo-600 dark:text-indigo-400",
  captado: "text-emerald-600 dark:text-emerald-400",
  perdido: "text-rose-600 dark:text-rose-400",
};

function fmtContacto(fecha: string | null): string {
  const dias = diasDesde(fecha);
  if (dias === null) return "Sin contactar";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return `Hace ${dias}d`;
}

function fmtProxima(fecha: string | null): string {
  if (!fecha) return null as unknown as string;
  const d = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - hoy.getTime()) / 86400000);
  if (diff < 0) return `⚠ Hace ${Math.abs(diff)}d`;
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function KanbanPropietarios({
  propietarios,
  agentes,
  basePath = "/inmobiliaria/propietarios",
}: {
  propietarios: Propietario[];
  agentes: Record<string, string>;
  basePath?: string;
}) {
  const estados = ESTADOS_PROPIETARIO.filter((e) => e !== "perdido");

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {estados.map((estado) => {
        const items = propietarios.filter((p) => p.estado === estado);
        return (
          <div key={estado} className={cn("flex-shrink-0 w-64 rounded-xl border-2 bg-muted/20", COL_COLOR[estado])}>
            <div className="px-3 py-2.5 border-b">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-bold uppercase tracking-wide", COL_HEADER[estado])}>
                  {ETIQUETAS_ESTADO[estado]}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>
            </div>

            <div className="space-y-2 p-2">
              {items.map((p) => {
                const prioridad = calcularPrioridad(p);
                const score = calcularCaptacionScore(p);
                const nombreAgente = p.agente_id ? (agentes[p.agente_id] ?? "").split(" ")[0] : null;
                const proxima = fmtProxima(p.fecha_proxima_accion);
                const esVencida = p.fecha_proxima_accion && new Date(p.fecha_proxima_accion) < new Date();

                return (
                  <Link
                    key={p.id}
                    href={`${basePath}/${p.id}`}
                    className="block rounded-lg border bg-card p-3 space-y-1.5 hover:shadow-md transition-shadow"
                  >
                    {/* Top row: prioridad dot + score */}
                    <div className="flex items-center justify-between">
                      {prioridad ? (
                        <div className="flex items-center gap-1.5">
                          <span className={cn("size-2 rounded-full", PRIORIDAD_DOT[prioridad])} />
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {PRIORIDAD_LABEL[prioridad]}
                          </span>
                        </div>
                      ) : <span />}
                      <span className="text-[11px] font-bold text-primary">🎯 {score}</span>
                    </div>

                    {/* Nombre */}
                    <p className="font-semibold leading-tight">{p.nombre}</p>

                    {/* Dirección */}
                    {p.direccion && (
                      <p className="text-xs text-muted-foreground line-clamp-1">📍 {p.direccion}</p>
                    )}

                    {/* Próxima acción */}
                    {proxima && (
                      <p className={cn("text-xs", esVencida ? "text-red-600 font-semibold dark:text-red-400" : "text-muted-foreground")}>
                        📅 {proxima}
                      </p>
                    )}

                    {/* Asesor + contacto */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      {nombreAgente && <span>👤 {nombreAgente}</span>}
                      <span className="ml-auto">⏱ {fmtContacto(p.fecha_ultimo_contacto)}</span>
                    </div>
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
