"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ETIQUETAS_ESTADO_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  type Inmueble,
} from "@/app/asesor/inmuebles/constantes";
import { FotoMiniatura } from "@/components/asesor/inmuebles/foto-miniatura";
import { eliminarInmueble } from "@/app/asesor/inmuebles/actions";
import { BotonEliminar } from "@/components/inmobiliaria/boton-eliminar";
import { useMoneda } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

type InmuebleConAgente = Inmueble & { agente_id: string | null };

type Orden = "direccion" | "precio" | "visitas" | "metros_cuadrados";

const COLOR_ESTADO: Record<string, string> = {
  captacion: "bg-sky-500/15 text-sky-600",
  preparacion: "bg-amber-500/15 text-amber-600",
  publicado: "bg-cyan-500/15 text-cyan-600",
  visitas: "bg-orange-500/15 text-orange-600",
  oferta: "bg-violet-500/15 text-violet-600",
  reservado: "bg-indigo-500/15 text-indigo-600",
  vendido: "bg-emerald-500/15 text-emerald-600",
};

export function Tabla({
  inmuebles,
  agentesPorId,
  basePath = "/inmobiliaria/inmuebles",
  gestor = true,
}: {
  inmuebles: InmuebleConAgente[];
  agentesPorId: Map<string, string>;
  basePath?: string;
  gestor?: boolean;
}) {
  const { formatear } = useMoneda();
  const [orden, setOrden] = useState<Orden>("direccion");

  const ordenados = useMemo(() => {
    const copia = [...inmuebles];
    copia.sort((a, b) => {
      const va = a[orden];
      const vb = b[orden];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return vb - va;
      return String(va).localeCompare(String(vb));
    });
    return copia;
  }, [inmuebles, orden]);

  if (inmuebles.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay inmuebles que coincidan.</p>;
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
          <option value="direccion">Dirección</option>
          <option value="precio">Precio</option>
          <option value="visitas">Visitas</option>
          <option value="metros_cuadrados">m²</option>
        </select>
      </div>

      {ordenados.map((i) => (
        <Link
          key={i.id}
          href={`${basePath}/${i.id}`}
          className="flex items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-accent/40"
        >
          <FotoMiniatura rutaStorage={i.foto} className="size-16 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{i.direccion}</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    COLOR_ESTADO[i.estado] ?? "bg-muted text-muted-foreground"
                  )}
                >
                  {ETIQUETAS_ESTADO_INMUEBLE[i.estado] ?? i.estado}
                </span>
                {gestor && (
                  <BotonEliminar
                    id={i.id}
                    mensaje={`¿Eliminar el inmueble en ${i.direccion}? Esta acción no se puede deshacer.`}
                    eliminarAction={eliminarInmueble}
                  />
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {i.tipo ? ETIQUETAS_TIPO_INMUEBLE[i.tipo] ?? i.tipo : "Sin tipo"}
              {i.poblacion ? ` · ${i.poblacion}` : ""}
              {i.referencia ? ` · Ref. ${i.referencia}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">{formatear(i.precio)}</span>
              <span className="text-xs text-muted-foreground">
                {agentesPorId.get(i.agente_id ?? "") ?? "Sin asignar"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
              <span>👀 {i.visitas} visitas</span>
              <span>{i.metros_cuadrados ? `${i.metros_cuadrados} m²` : "Sin m²"}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
