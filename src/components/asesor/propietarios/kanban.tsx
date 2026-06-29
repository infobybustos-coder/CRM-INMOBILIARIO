"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  ESTADOS_PROPIETARIO,
  ETIQUETAS_ESTADO,
  ETIQUETAS_TIPO_INMUEBLE,
  type Propietario,
} from "@/app/asesor/propietarios/constantes";
import { actualizarEstadoPropietario } from "@/app/asesor/propietarios/actions";
import { calcularPrioridad, calcularCaptacionScore } from "@/lib/prioridad";
import { cn } from "@/lib/utils";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

const COLOR_ESTADO: Record<string, string> = {
  nuevo_lead: "bg-sky-500",
  contactado: "bg-cyan-500",
  tasacion_programada: "bg-amber-500",
  tasacion_realizada: "bg-orange-500",
  negociacion: "bg-violet-500",
  exclusiva_firmada: "bg-indigo-500",
  captado: "bg-emerald-500",
  perdido: "bg-rose-500",
};

const FONDO_ESTADO: Record<string, string> = {
  nuevo_lead: "bg-sky-500/10",
  contactado: "bg-cyan-500/10",
  tasacion_programada: "bg-amber-500/10",
  tasacion_realizada: "bg-orange-500/10",
  negociacion: "bg-violet-500/10",
  exclusiva_firmada: "bg-indigo-500/10",
  captado: "bg-emerald-500/10",
  perdido: "bg-rose-500/10",
};

function esVencida(fecha: string | null) {
  if (!fecha) return false;
  return new Date(fecha) < new Date(new Date().toDateString());
}

function Tarjeta({ propietario }: { propietario: Propietario }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: propietario.id,
  });

  const vencida = esVencida(propietario.fecha_proxima_accion);
  const prioridad = calcularPrioridad(propietario);
  const score = calcularCaptacionScore(propietario);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn(
        "cursor-grab touch-none rounded-lg border p-3 text-sm shadow-sm transition-shadow",
        "hover:shadow-md active:cursor-grabbing",
        FONDO_ESTADO[propietario.estado] ?? "bg-card",
        vencida ? "border-red-500/60 ring-1 ring-red-500/20" : "border-border",
        isDragging && "z-10 rotate-1 opacity-70 shadow-lg"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/asesor/propietarios/${propietario.id}`}
          onClick={(e) => isDragging && e.preventDefault()}
          className="font-medium text-foreground hover:text-primary"
        >
          {propietario.nombre}
        </Link>
        {prioridad && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              COLOR_PRIORIDAD[prioridad]
            )}
          >
            {prioridad}
          </span>
        )}
      </div>
      <p className="text-muted-foreground">{propietario.telefono}</p>
      <p className="mt-1 text-xs text-muted-foreground">Score: {score}</p>
      {propietario.tipo_inmueble && (
        <p className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {ETIQUETAS_TIPO_INMUEBLE[propietario.tipo_inmueble] ?? propietario.tipo_inmueble}
        </p>
      )}
      {propietario.valor_estimado ? (
        <p className="mt-1 font-medium">
          {Number(propietario.valor_estimado).toLocaleString("es-ES")} €
        </p>
      ) : null}
      {propietario.fecha_proxima_accion && (
        <p
          className={cn(
            "mt-1 text-xs",
            vencida ? "font-semibold text-red-500" : "text-muted-foreground"
          )}
        >
          {new Date(propietario.fecha_proxima_accion).toLocaleDateString("es-ES")}
          {vencida && " ⚠ vencida"}
        </p>
      )}
    </div>
  );
}

function Columna({
  estado,
  propietarios,
}: {
  estado: string;
  propietarios: Propietario[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-[calc(100vh-13rem)] w-72 shrink-0 flex-col gap-2 rounded-xl border bg-muted/30 p-2 transition-colors",
        isOver && "bg-primary/10 ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-center gap-2 px-1 pt-1">
        <span className={cn("size-2.5 rounded-full", COLOR_ESTADO[estado])} />
        <h2 className="text-sm font-semibold">{ETIQUETAS_ESTADO[estado]}</h2>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {propietarios.length}
        </span>
      </div>
      <div className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto">
        {propietarios.map((p) => (
          <Tarjeta key={p.id} propietario={p} />
        ))}
      </div>
    </div>
  );
}

export function Kanban({ propietarios }: { propietarios: Propietario[] }) {
  const [items, setItems] = useState(propietarios);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const id = String(active.id);
    const nuevoEstado = String(over.id);
    const actual = items.find((p) => p.id === id);
    if (!actual || actual.estado === nuevoEstado) return;

    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)));
    actualizarEstadoPropietario(id, nuevoEstado);
  }

  const activo = activeId ? items.find((p) => p.id === activeId) ?? null : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ESTADOS_PROPIETARIO.map((estado) => (
          <Columna
            key={estado}
            estado={estado}
            propietarios={items.filter((p) => p.estado === estado)}
          />
        ))}
      </div>
      <DragOverlay>{activo ? <Tarjeta propietario={activo} /> : null}</DragOverlay>
    </DndContext>
  );
}
