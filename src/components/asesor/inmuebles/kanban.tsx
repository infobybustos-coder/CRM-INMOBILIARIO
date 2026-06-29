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
  ESTADOS_INMUEBLE,
  ETIQUETAS_ESTADO_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  type Inmueble,
} from "@/app/asesor/inmuebles/constantes";
import { actualizarEstadoInmueble } from "@/app/asesor/inmuebles/actions";
import { cn } from "@/lib/utils";

const COLOR_ESTADO: Record<string, string> = {
  captacion: "bg-sky-500",
  preparacion: "bg-amber-500",
  publicado: "bg-cyan-500",
  visitas: "bg-orange-500",
  oferta: "bg-violet-500",
  reservado: "bg-indigo-500",
  vendido: "bg-emerald-500",
};

const FONDO_ESTADO: Record<string, string> = {
  captacion: "bg-sky-500/10",
  preparacion: "bg-amber-500/10",
  publicado: "bg-cyan-500/10",
  visitas: "bg-orange-500/10",
  oferta: "bg-violet-500/10",
  reservado: "bg-indigo-500/10",
  vendido: "bg-emerald-500/10",
};

function Tarjeta({ inmueble }: { inmueble: Inmueble }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: inmueble.id,
  });

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
        FONDO_ESTADO[inmueble.estado] ?? "bg-card",
        "border-border",
        isDragging && "z-10 rotate-1 opacity-70 shadow-lg"
      )}
    >
      <Link
        href={`/asesor/inmuebles/${inmueble.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
        className="font-medium text-foreground hover:text-primary"
      >
        {inmueble.direccion}
      </Link>
      {inmueble.tipo && (
        <p className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {ETIQUETAS_TIPO_INMUEBLE[inmueble.tipo] ?? inmueble.tipo}
        </p>
      )}
      {inmueble.precio ? (
        <p className="mt-1 font-medium">{Number(inmueble.precio).toLocaleString("es-ES")} €</p>
      ) : null}
      {(inmueble.metros_cuadrados || inmueble.habitaciones || inmueble.banos) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {[
            inmueble.metros_cuadrados ? `${inmueble.metros_cuadrados} m²` : null,
            inmueble.habitaciones ? `${inmueble.habitaciones} hab.` : null,
            inmueble.banos ? `${inmueble.banos} baños` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

function Columna({ estado, inmuebles }: { estado: string; inmuebles: Inmueble[] }) {
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
        <h2 className="text-sm font-semibold">{ETIQUETAS_ESTADO_INMUEBLE[estado]}</h2>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {inmuebles.length}
        </span>
      </div>
      <div className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto">
        {inmuebles.map((i) => (
          <Tarjeta key={i.id} inmueble={i} />
        ))}
      </div>
    </div>
  );
}

export function Kanban({ inmuebles }: { inmuebles: Inmueble[] }) {
  const [items, setItems] = useState(inmuebles);
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
    const actual = items.find((i) => i.id === id);
    if (!actual || actual.estado === nuevoEstado) return;

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, estado: nuevoEstado } : i)));
    actualizarEstadoInmueble(id, nuevoEstado);
  }

  const activo = activeId ? items.find((i) => i.id === activeId) ?? null : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ESTADOS_INMUEBLE.map((estado) => (
          <Columna key={estado} estado={estado} inmuebles={items.filter((i) => i.estado === estado)} />
        ))}
      </div>
      <DragOverlay>{activo ? <Tarjeta inmueble={activo} /> : null}</DragOverlay>
    </DndContext>
  );
}
