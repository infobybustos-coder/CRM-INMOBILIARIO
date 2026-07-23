"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_FUENTE_LEAD,
  type Propietario,
} from "@/app/asesor/propietarios/constantes";
import { calcularPrioridad, calcularCaptacionScore } from "@/lib/prioridad";
import { eliminarPropietario } from "@/app/asesor/propietarios/actions";
import { BotonEliminar } from "@/components/inmobiliaria/boton-eliminar";
import { useMoneda } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

type PropietarioConAgente = Propietario & { agente_id: string | null };

type Orden = "score" | "nombre" | "fecha_proxima_accion" | "fecha_ultimo_contacto" | "valor_estimado";

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
  propietarios,
  agentesPorId,
  basePath = "/inmobiliaria/propietarios",
}: {
  propietarios: PropietarioConAgente[];
  agentesPorId: Map<string, string>;
  basePath?: string;
}) {
  const { formatear } = useMoneda();
  const [orden, setOrden] = useState<Orden>("score");

  const ordenados = useMemo(() => {
    const copia = [...propietarios];
    copia.sort((a, b) => {
      const va = orden === "score" ? calcularCaptacionScore(a) : a[orden as keyof Propietario];
      const vb = orden === "score" ? calcularCaptacionScore(b) : b[orden as keyof Propietario];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return vb - va;
      return String(va).localeCompare(String(vb));
    });
    return copia;
  }, [propietarios, orden]);

  if (propietarios.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay propietarios que coincidan.</p>;
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
          <option value="valor_estimado">Valor estimado</option>
        </select>
      </div>

      {ordenados.map((p) => {
        const prioridad = calcularPrioridad(p);
        const score = calcularCaptacionScore(p);
        const vencida = p.fecha_proxima_accion ? new Date(p.fecha_proxima_accion) < new Date() : false;
        const agente = agentesPorId.get(p.agente_id ?? "");

        return (
          <Link
            key={p.id}
            href={`${basePath}/${p.id}`}
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
              <div className="flex items-center gap-2">
                {(p.fuente_lead || p.valor_estimado) && (
                  <span className="text-xs text-muted-foreground">
                    {p.fuente_lead && ETIQUETAS_FUENTE_LEAD[p.fuente_lead]}
                    {p.fuente_lead && p.valor_estimado ? " · " : ""}
                    {p.valor_estimado ? formatear(p.valor_estimado) : ""}
                  </span>
                )}
                <BotonEliminar
                  id={p.id}
                  mensaje={`¿Eliminar a ${p.nombre}? Esta acción no se puede deshacer.`}
                  eliminarAction={eliminarPropietario}
                />
              </div>
            </div>

            <p className="mt-1.5 font-medium">{p.nombre}</p>
            {p.direccion && (
              <p className="text-sm text-muted-foreground">📍 {p.direccion}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                {ETIQUETAS_ESTADO[p.estado] ?? p.estado}
              </span>
              <span>{agente ?? "Sin asignar"}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
              <span className={cn(vencida && "font-semibold text-red-500")}>
                📅{" "}
                {p.fecha_proxima_accion
                  ? new Date(p.fecha_proxima_accion).toLocaleDateString("es-ES")
                  : "Sin próxima acción"}
                {vencida && " ⚠"}
              </span>
              <span>
                ⏱{" "}
                {p.fecha_ultimo_contacto
                  ? new Date(p.fecha_ultimo_contacto).toLocaleDateString("es-ES")
                  : "Sin contacto"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
