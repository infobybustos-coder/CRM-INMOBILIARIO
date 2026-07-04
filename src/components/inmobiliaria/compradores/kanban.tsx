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
  type Comprador,
} from "@/app/asesor/compradores/constantes";
import { actualizarEstadoComprador, eliminarComprador } from "@/app/asesor/compradores/actions";
import { calcularPrioridadComprador, calcularCompraScore } from "@/lib/prioridad";
import { BotonEliminar } from "@/components/inmobiliaria/boton-eliminar";
import { useMoneda } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

type CompradorConAgente = Comprador & { agente_id: string | null };

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

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Tarjeta({
  comprador,
  agentesPorId,
  zonasPorId,
  basePath = "/inmobiliaria/compradores",
}: {
  comprador: CompradorConAgente;
  agentesPorId: Map<string, string>;
  zonasPorId: Map<string, string>;
  basePath?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: comprador.id,
  });
  const { formatear } = useMoneda();

  const urgente = comprador.urgencia === "alta";
  const { presupuesto_min: min, presupuesto_max: max } = comprador;
  const presupuesto =
    min && max
      ? `${formatear(min)} - ${formatear(max)}`
      : min
        ? `Desde ${formatear(min)}`
        : max
          ? `Hasta ${formatear(max)}`
          : null;
  const prioridad = calcularPrioridadComprador(comprador);
  const score = calcularCompraScore(comprador);
  const nombreAgente = agentesPorId.get(comprador.agente_id ?? "");
  const zona = zonasPorId.get(comprador.zona_buscada_id ?? "");

  return (
    <Link
      href={`${basePath}/${comprador.id}`}
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
        <span className="font-medium text-foreground">{comprador.nombre}</span>
        <div className="flex shrink-0 items-center gap-1">
          {prioridad && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                COLOR_PRIORIDAD[prioridad]
              )}
            >
              {prioridad}
            </span>
          )}
          <BotonEliminar
            id={comprador.id}
            mensaje={`¿Eliminar a ${comprador.nombre}? Esta acción no se puede deshacer.`}
            eliminarAction={eliminarComprador}
            className="size-6"
          />
        </div>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">Score: {score}</p>
      {presupuesto && <p className="mt-1 font-medium">{presupuesto}</p>}
      {zona && (
        <p className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {zona}
        </p>
      )}
      {comprador.fecha_proxima_accion && (
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(comprador.fecha_proxima_accion).toLocaleDateString("es-ES")}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5 border-t pt-1.5">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
          {nombreAgente ? iniciales(nombreAgente) : "?"}
        </span>
        <span className="text-xs text-muted-foreground">{nombreAgente ?? "Sin asignar"}</span>
      </div>
    </Link>
  );
}

function Columna({
  estado,
  compradores,
  agentesPorId,
  zonasPorId,
  basePath = "/inmobiliaria/compradores",
}: {
  estado: string;
  compradores: CompradorConAgente[];
  agentesPorId: Map<string, string>;
  zonasPorId: Map<string, string>;
  basePath?: string;
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
          <Tarjeta
            key={c.id}
            comprador={c}
            agentesPorId={agentesPorId}
            zonasPorId={zonasPorId}
            basePath={basePath}
          />
        ))}
      </div>
    </div>
  );
}

export function Kanban({
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
            agentesPorId={agentesPorId}
            zonasPorId={zonasPorId}
            basePath={basePath}
          />
        ))}
      </div>
      <DragOverlay>
        {activo ? (
          <Tarjeta comprador={activo} agentesPorId={agentesPorId} zonasPorId={zonasPorId} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
