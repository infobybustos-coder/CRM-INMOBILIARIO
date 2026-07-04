"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ETIQUETAS_ESTADO_COMPRADOR, type Comprador } from "@/app/asesor/compradores/constantes";
import { calcularPrioridadComprador, calcularCompraScore } from "@/lib/prioridad";
import { useMoneda } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

type CompradorConAgente = Comprador & { agente_id: string | null };

type Orden = "score" | "nombre" | "fecha_proxima_accion" | "fecha_ultimo_contacto";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500/10 text-red-600",
  media: "bg-amber-500/10 text-amber-600",
  baja: "bg-muted text-muted-foreground",
};

const PUNTO_PRIORIDAD: Record<string, string> = {
  alta: "🔴",
  media: "🟡",
  baja: "⚪",
};

export function Tabla({
  compradores,
  agentesPorId,
  zonasPorId,
  basePath = "/inmobiliaria/compradores",
}: {
  compradores: CompradorConAgente[];
  agentesPorId: Map<string, string>;
  zonasPorId: Map<string, string>;
  basePath?: string;
}) {
  const { formatear } = useMoneda();
  const [orden, setOrden] = useState<Orden>("score");

  const ordenados = useMemo(() => {
    const copia = [...compradores];
    copia.sort((a, b) => {
      const va = orden === "score" ? calcularCompraScore(a) : a[orden as keyof Comprador];
      const vb = orden === "score" ? calcularCompraScore(b) : b[orden as keyof Comprador];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return vb - va;
      return String(va).localeCompare(String(vb));
    });
    return copia;
  }, [compradores, orden]);

  if (compradores.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay compradores que coincidan.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Ordenar por</span>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as Orden)}
          className="rounded-md border bg-background px-2 py-1"
        >
          <option value="score">Score</option>
          <option value="nombre">Nombre</option>
          <option value="fecha_proxima_accion">Próxima acción</option>
          <option value="fecha_ultimo_contacto">Último contacto</option>
        </select>
      </div>

      {ordenados.map((c) => {
        const prioridad = calcularPrioridadComprador(c);
        const score = calcularCompraScore(c);
        const vencida = c.fecha_proxima_accion ? new Date(c.fecha_proxima_accion) < new Date() : false;
        const agente = agentesPorId.get(c.agente_id ?? "");
        const zona = zonasPorId.get(c.zona_buscada_id ?? "");
        const presupuesto =
          c.presupuesto_min && c.presupuesto_max
            ? `${formatear(c.presupuesto_min)} - ${formatear(c.presupuesto_max)}`
            : c.presupuesto_max
              ? `Hasta ${formatear(c.presupuesto_max)}`
              : c.presupuesto_min
                ? `Desde ${formatear(c.presupuesto_min)}`
                : null;

        return (
          <Link
            key={c.id}
            href={`${basePath}/${c.id}`}
            className="block rounded-xl border p-4 transition-colors hover:bg-accent/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {prioridad && (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                      COLOR_PRIORIDAD[prioridad]
                    )}
                  >
                    {PUNTO_PRIORIDAD[prioridad]} {prioridad}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">Score {score}</span>
              </div>
              {presupuesto && <span className="text-xs text-muted-foreground">{presupuesto}</span>}
            </div>

            <p className="mt-1.5 font-medium">{c.nombre}</p>
            {zona && <p className="text-sm text-muted-foreground">📍 {zona}</p>}
            {c.habitaciones ? (
              <p className="text-sm text-muted-foreground">🛏 {c.habitaciones} habitaciones</p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                {ETIQUETAS_ESTADO_COMPRADOR[c.estado] ?? c.estado}
              </span>
              <span>{agente ?? "Sin asignar"}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
              <span className={cn(vencida && "font-semibold text-red-500")}>
                📅{" "}
                {c.fecha_proxima_accion
                  ? new Date(c.fecha_proxima_accion).toLocaleDateString("es-ES")
                  : "Sin próxima acción"}
                {vencida && " ⚠"}
              </span>
              <span>
                ⏱{" "}
                {c.fecha_ultimo_contacto
                  ? new Date(c.fecha_ultimo_contacto).toLocaleDateString("es-ES")
                  : "Sin contacto"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
