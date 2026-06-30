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
  ESTADOS_COMPRADOR,
  ETIQUETAS_ESTADO_COMPRADOR,
  ETIQUETAS_TIPO_INMUEBLE,
  type Comprador,
} from "@/app/asesor/compradores/constantes";
import { actualizarEstadoComprador } from "@/app/asesor/compradores/actions";
import { calcularPrioridadComprador, calcularCompraScore } from "@/lib/prioridad";
import { cn } from "@/lib/utils";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

const COLOR_ESTADO: Record<string, string> = {
  nuevo: "bg-sky-500",
  cualificado: "bg-cyan-500",
  busqueda_activa: "bg-amber-500",
  visitas: "bg-orange-500",
  oferta: "bg-violet-500",
  reserva: "bg-indigo-500",
  comprado: "bg-emerald-500",
  perdido: "bg-rose-500",
};

const FONDO_ESTADO: Record<string, string> = {
  nuevo: "bg-sky-500/10",
  cualificado: "bg-cyan-500/10",
  busqueda_activa: "bg-amber-500/10",
  visitas: "bg-orange-500/10",
  oferta: "bg-violet-500/10",
  reserva: "bg-indigo-500/10",
  comprado: "bg-emerald-500/10",
  perdido: "bg-rose-500/10",
};

function formatearPresupuesto(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString("es-ES");
  if (min && max) return `${fmt(min)} € - ${fmt(max)} €`;
  if (min) return `Desde ${fmt(min)} €`;
  return `Hasta ${fmt(max!)} €`;
}

function Tarjeta({ comprador }: { comprador: Comprador }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: comprador.id,
  });

  const urgente = comprador.urgencia === "alta";
  const presupuesto = formatearPresupuesto(comprador.presupuesto_min, comprador.presupuesto_max);
  const prioridad = calcularPrioridadComprador(comprador);
  const score = calcularCompraScore(comprador);

  return (
    <Link
      href={`/asesor/compradores/${comprador.id}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => isDragging && e.preventDefault()}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn(
        "block cursor-grab touch-none rounded-lg border p-3 text-sm shadow-sm transition-shadow",
        "hover:shadow-md active:cursor-grabbing",
        FONDO_ESTADO[comprador.estado] ?? "bg-card",
        urgente ? "border-red-500/60 ring-1 ring-red-500/20" : "border-border",
        isDragging && "z-10 rotate-1 opacity-70 shadow-lg"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">
          {comprador.nombre}
        </span>
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
      <p className="text-muted-foreground">{comprador.telefono}</p>
      <p className="mt-1 text-xs text-muted-foreground">Score: {score}</p>
      {comprador.tipo_inmueble && (
        <p className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {ETIQUETAS_TIPO_INMUEBLE[comprador.tipo_inmueble] ?? comprador.tipo_inmueble}
        </p>
      )}
      {presupuesto && <p className="mt-1 font-medium">{presupuesto}</p>}
      {urgente && (
        <p className="mt-1 text-xs font-semibold text-red-500">⚠ Urgencia alta</p>
      )}
    </Link>
  );
}

function Columna({
  estado,
  compradores,
}: {
  estado: string;
  compradores: Comprador[];
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
        <h2 className="text-sm font-semibold">{ETIQUETAS_ESTADO_COMPRADOR[estado]}</h2>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {compradores.length}
        </span>
      </div>
      <div className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto">
        {compradores.map((c) => (
          <Tarjeta key={c.id} comprador={c} />
        ))}
      </div>
    </div>
  );
}

export function Kanban({ compradores }: { compradores: Comprador[] }) {
  const [items, setItems] = useState(compradores);
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
    const actual = items.find((c) => c.id === id);
    if (!actual || actual.estado === nuevoEstado) return;

    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c)));
    actualizarEstadoComprador(id, nuevoEstado);
  }

  const activo = activeId ? items.find((c) => c.id === activeId) ?? null : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ESTADOS_COMPRADOR.map((estado) => (
          <Columna
            key={estado}
            estado={estado}
            compradores={items.filter((c) => c.estado === estado)}
          />
        ))}
      </div>
      <DragOverlay>{activo ? <Tarjeta comprador={activo} /> : null}</DragOverlay>
    </DndContext>
  );
}
