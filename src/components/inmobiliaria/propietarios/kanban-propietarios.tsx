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
import { calcularPrioridad, calcularCaptacionScore, diasDesde } from "@/lib/prioridad";
import {
  ESTADOS_PROPIETARIO,
  ETIQUETAS_ESTADO,
} from "@/app/asesor/propietarios/constantes";
import { actualizarEstadoPropietario } from "@/app/asesor/propietarios/actions";
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
const COL_DOT: Record<string, string> = {
  nuevo_lead: "bg-sky-500",
  contactado: "bg-cyan-500",
  tasacion_programada: "bg-amber-500",
  tasacion_realizada: "bg-orange-500",
  negociacion: "bg-violet-500",
  exclusiva_firmada: "bg-indigo-500",
  captado: "bg-emerald-500",
  perdido: "bg-rose-500",
};

function camposIncompletos(p: Propietario): string[] {
  const faltantes: string[] = [];
  if (!p.telefono) faltantes.push("teléfono");
  if (!p.direccion) faltantes.push("dirección");
  if (!p.tipo_inmueble) faltantes.push("tipo inmueble");
  if (!p.valor_estimado) faltantes.push("valor estimado");
  return faltantes;
}

function fmtContacto(fecha: string | null): string {
  const dias = diasDesde(fecha);
  if (dias === null) return "Sin contactar";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return `Hace ${dias}d`;
}

function fmtProxima(fecha: string | null): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - hoy.getTime()) / 86400000);
  if (diff < 0) return `⚠ Hace ${Math.abs(diff)}d`;
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function Tarjeta({
  propietario,
  agentes,
  basePath,
}: {
  propietario: Propietario;
  agentes: Record<string, string>;
  basePath: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: propietario.id,
  });

  const prioridad = calcularPrioridad(propietario);
  const score = calcularCaptacionScore(propietario);
  const nombreAgente = propietario.agente_id ? (agentes[propietario.agente_id] ?? "").split(" ")[0] : null;
  const proxima = fmtProxima(propietario.fecha_proxima_accion);
  const esVencida = propietario.fecha_proxima_accion && new Date(propietario.fecha_proxima_accion) < new Date();
  const incompletos = camposIncompletos(propietario);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        "cursor-grab touch-none rounded-lg border bg-card shadow-sm transition-shadow active:cursor-grabbing",
        "hover:shadow-md hover:border-primary/40",
        isDragging && "z-10 rotate-1 opacity-70 shadow-lg"
      )}
    >
      <Link
        href={`${basePath}/${propietario.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
        className="block p-3 space-y-1.5"
      >
        <div className="flex items-center justify-between">
          {prioridad ? (
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", PRIORIDAD_DOT[prioridad])} />
              <span className="text-[11px] font-medium text-muted-foreground">{PRIORIDAD_LABEL[prioridad]}</span>
            </div>
          ) : <span />}
          <div className="flex items-center gap-1.5">
            {incompletos.length > 0 && (
              <span
                title={`Faltan: ${incompletos.join(", ")}`}
                className="size-2 rounded-full bg-red-500"
              />
            )}
            <span className="text-[11px] font-bold text-primary">🎯 {score}</span>
          </div>
        </div>

        <p className="font-semibold leading-tight">{propietario.nombre}</p>

        {propietario.direccion && (
          <p className="text-xs text-muted-foreground line-clamp-1">📍 {propietario.direccion}</p>
        )}

        {proxima && (
          <p className={cn("text-xs", esVencida ? "text-red-600 font-semibold dark:text-red-400" : "text-muted-foreground")}>
            📅 {proxima}
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {nombreAgente && <span>👤 {nombreAgente}</span>}
          <span className="ml-auto">⏱ {fmtContacto(propietario.fecha_ultimo_contacto)}</span>
        </div>
      </Link>
    </div>
  );
}

function Columna({
  estado,
  items,
  agentes,
  basePath,
}: {
  estado: string;
  items: Propietario[];
  agentes: Record<string, string>;
  basePath: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-[calc(100vh-16rem)] w-64 shrink-0 flex-col rounded-xl border-2 bg-muted/20 transition-colors",
        COL_COLOR[estado],
        isOver && "bg-primary/10 ring-2 ring-primary/30"
      )}
    >
      <div className="px-3 py-2.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", COL_DOT[estado])} />
          <span className={cn("text-xs font-bold uppercase tracking-wide", COL_HEADER[estado])}>
            {ETIQUETAS_ESTADO[estado]}
          </span>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {items.map((p) => (
          <Tarjeta key={p.id} propietario={p} agentes={agentes} basePath={basePath} />
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground/40">Sin registros</p>
        )}
      </div>
    </div>
  );
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
      <div className="flex gap-3 overflow-x-auto pb-4">
        {ESTADOS_PROPIETARIO.map((estado) => (
          <Columna
            key={estado}
            estado={estado}
            items={items.filter((p) => p.estado === estado)}
            agentes={agentes}
            basePath={basePath}
          />
        ))}
      </div>
      <DragOverlay>
        {activo ? <Tarjeta propietario={activo} agentes={agentes} basePath={basePath} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
