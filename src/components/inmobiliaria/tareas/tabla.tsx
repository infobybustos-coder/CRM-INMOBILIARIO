"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, User, UserCog, Eye, CheckCheck, CalendarDays } from "lucide-react";
import { completarTarea, reprogramarTarea, eliminarTarea } from "@/app/inmobiliaria/tareas/actions";
import {
  ETIQUETA_PRIORIDAD,
  COLOR_PRIORIDAD,
  ETIQUETA_ESTADO_TAREA,
  COLOR_ESTADO_TAREA,
  ETIQUETA_ENTIDAD,
  COLOR_ENTIDAD,
  BORDE_ENTIDAD,
} from "@/app/inmobiliaria/tareas/constantes";
import { BotonEliminar } from "@/components/inmobiliaria/boton-eliminar";
import { cn } from "@/lib/utils";

export type TareaFila = {
  id: string;
  titulo: string;
  prioridad: string;
  estado: string;
  fecha_vencimiento: string | null;
  entidadTipo: string | null;
  relacionadoCon: string | null;
  hrefRelacionado: string | null;
  nombreResponsable: string | null;
};

function aInputFecha(fecha: string) {
  const d = new Date(fecha);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Fila({ tarea }: { tarea: TareaFila }) {
  const [pending, startTransition] = useTransition();
  const [cambiandoFecha, setCambiandoFecha] = useState(false);
  const [fecha, setFecha] = useState(
    tarea.fecha_vencimiento ? aInputFecha(tarea.fecha_vencimiento) : ""
  );
  const activa = tarea.estado === "pendiente" || tarea.estado === "en_progreso";
  const vencida =
    activa && tarea.fecha_vencimiento !== null && new Date(tarea.fecha_vencimiento) < new Date();

  return (
    <div
      className={cn(
        "rounded-xl border border-l-4 p-4 transition-colors",
        tarea.entidadTipo ? BORDE_ENTIDAD[tarea.entidadTipo] : "border-l-transparent",
        vencida ? "border-red-500/40 bg-red-500/5" : "hover:bg-accent/40"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {tarea.entidadTipo && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                COLOR_ENTIDAD[tarea.entidadTipo]
              )}
            >
              {ETIQUETA_ENTIDAD[tarea.entidadTipo]}
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              COLOR_PRIORIDAD[tarea.prioridad] ?? COLOR_PRIORIDAD.media
            )}
          >
            {ETIQUETA_PRIORIDAD[tarea.prioridad] ?? tarea.prioridad}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              COLOR_ESTADO_TAREA[tarea.estado] ?? COLOR_ESTADO_TAREA.pendiente
            )}
          >
            {ETIQUETA_ESTADO_TAREA[tarea.estado] ?? tarea.estado}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tarea.fecha_vencimiento && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {new Date(tarea.fecha_vencimiento).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          <BotonEliminar
            id={tarea.id}
            mensaje={`¿Eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer.`}
            eliminarAction={eliminarTarea}
          />
        </div>
      </div>

      <div className="mt-2 font-medium">{tarea.titulo}</div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {tarea.relacionadoCon && (
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" />
            {tarea.hrefRelacionado ? (
              <Link href={tarea.hrefRelacionado} className="hover:text-foreground hover:underline">
                {tarea.relacionadoCon}
              </Link>
            ) : (
              tarea.relacionadoCon
            )}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <UserCog className="size-3.5" /> {tarea.nombreResponsable ?? "Sin asignar"}
        </span>
      </div>

      {activa && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => completarTarea(tarea.id))}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-500/10"
          >
            <CheckCheck className="size-3.5" /> Completar
          </button>
          <button
            type="button"
            onClick={() => setCambiandoFecha((v) => !v)}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-sky-600 hover:bg-sky-500/10"
          >
            <CalendarClock className="size-3.5" /> Cambiar fecha
          </button>
          <Link
            href={`/inmobiliaria/tareas/${tarea.id}`}
            className="ml-auto flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            <Eye className="size-3.5" /> Abrir ficha
          </Link>
        </div>
      )}

      {cambiandoFecha && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-muted/40 p-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-xs"
          />
          <button
            type="button"
            disabled={pending || !fecha}
            onClick={() =>
              startTransition(async () => {
                await reprogramarTarea(tarea.id, fecha);
                setCambiandoFecha(false);
              })
            }
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      )}

      {!activa && (
        <div className="mt-3 border-t pt-3">
          <Link
            href={`/inmobiliaria/tareas/${tarea.id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Eye className="size-3.5" /> Abrir ficha
          </Link>
        </div>
      )}
    </div>
  );
}

export function Tabla({ tareas }: { tareas: TareaFila[] }) {
  if (tareas.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay tareas registradas.</p>;
  }

  return (
    <div className="space-y-2">
      {tareas.map((t) => (
        <Fila key={t.id} tarea={t} />
      ))}
    </div>
  );
}
