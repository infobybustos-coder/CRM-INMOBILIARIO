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
import { cn } from "@/lib/utils";

function esVencida(fecha: string | null) {
  if (!fecha) return false;
  return new Date(fecha) < new Date(new Date().toDateString());
}

function Tarjeta({ propietario }: { propietario: Propietario }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: propietario.id,
  });

  const vencida = esVencida(propietario.fecha_proxima_accion);

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
        "cursor-grab touch-none rounded-md border bg-card p-3 text-sm shadow-sm active:cursor-grabbing",
        vencida && "border-red-500",
        isDragging && "z-10 opacity-70"
      )}
    >
      <Link
        href={`/asesor/propietarios/${propietario.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
        className="font-medium underline"
      >
        {propietario.nombre}
      </Link>
      <p className="text-muted-foreground">{propietario.telefono}</p>
      {propietario.tipo_inmueble && (
        <p className="text-muted-foreground">
          {ETIQUETAS_TIPO_INMUEBLE[propietario.tipo_inmueble] ?? propietario.tipo_inmueble}
        </p>
      )}
      {propietario.valor_estimado ? (
        <p>{Number(propietario.valor_estimado).toLocaleString("es-ES")} €</p>
      ) : null}
      {propietario.fecha_proxima_accion && (
        <p className={cn(vencida && "font-medium text-red-500")}>
          Próxima acción: {new Date(propietario.fecha_proxima_accion).toLocaleDateString("es-ES")}
          {vencida && " ⚠"}
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
        "flex w-72 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-2",
        isOver && "bg-accent/50"
      )}
    >
      <h2 className="px-1 text-sm font-semibold">
        {ETIQUETAS_ESTADO[estado]} <span className="text-muted-foreground">({propietarios.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
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
