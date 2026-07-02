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
import { calcularPrioridadComprador, calcularCompraScore } from "@/lib/prioridad";
import { ESTADOS_COMPRADOR, ETIQUETAS_ESTADO_COMPRADOR } from "@/app/asesor/compradores/constantes";
import { actualizarEstadoComprador } from "@/app/asesor/compradores/actions";
import { cn } from "@/lib/utils";

type Comprador = {
  id: string;
  nombre: string;
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  tipo_inmueble: string | null;
  zona_buscada_id: string | null;
  urgencia: string | null;
  estado: string;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  agente_id: string | null;
};

const PRIORIDAD_DOT: Record<string, string> = {
  alta: "bg-red-500",
  media: "bg-amber-400",
  baja: "bg-emerald-400",
};
const COL_COLOR: Record<string, string> = {
  nuevo: "border-sky-400/40",
  cualificado: "border-cyan-400/40",
  busqueda_activa: "border-blue-400/40",
  visitas: "border-violet-400/40",
  oferta: "border-orange-400/40",
  reserva: "border-amber-400/40",
  comprado: "border-emerald-400/40",
  perdido: "border-rose-400/40",
};
const COL_HEADER: Record<string, string> = {
  nuevo: "text-sky-600 dark:text-sky-400",
  cualificado: "text-cyan-600 dark:text-cyan-400",
  busqueda_activa: "text-blue-600 dark:text-blue-400",
  visitas: "text-violet-600 dark:text-violet-400",
  oferta: "text-orange-600 dark:text-orange-400",
  reserva: "text-amber-600 dark:text-amber-400",
  comprado: "text-emerald-600 dark:text-emerald-400",
  perdido: "text-rose-600 dark:text-rose-400",
};
const COL_DOT: Record<string, string> = {
  nuevo: "bg-sky-500",
  cualificado: "bg-cyan-500",
  busqueda_activa: "bg-blue-500",
  visitas: "bg-violet-500",
  oferta: "bg-orange-500",
  reserva: "bg-amber-500",
  comprado: "bg-emerald-500",
  perdido: "bg-rose-500",
};

function camposIncompletos(c: Comprador): string[] {
  const faltantes: string[] = [];
  if (!c.presupuesto_max) faltantes.push("presupuesto");
  if (!c.tipo_inmueble) faltantes.push("tipo inmueble");
  if (!c.zona_buscada_id) faltantes.push("zona");
  if (!c.urgencia) faltantes.push("urgencia");
  return faltantes;
}

function fmtEuro(n: number | null): string {
  if (!n) return "";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M €`;
  if (n >= 1000) return `${Math.round(n / 1000)}k €`;
  return `${n} €`;
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
  comprador,
  agentes,
  zonas,
  basePath,
}: {
  comprador: Comprador;
  agentes: Record<string, string>;
  zonas: Record<string, string>;
  basePath: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: comprador.id,
  });

  const prioridad = calcularPrioridadComprador(comprador);
  const score = calcularCompraScore(comprador);
  const nombreAgente = comprador.agente_id ? (agentes[comprador.agente_id] ?? "").split(" ")[0] : null;
  const zona = comprador.zona_buscada_id ? zonas[comprador.zona_buscada_id] : null;
  const proxima = fmtProxima(comprador.fecha_proxima_accion);
  const esVencida = comprador.fecha_proxima_accion && new Date(comprador.fecha_proxima_accion) < new Date();
  const incompletos = camposIncompletos(comprador);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        "cursor-grab touch-none rounded-lg border bg-card p-3 space-y-1.5 shadow-sm transition-shadow active:cursor-grabbing",
        "hover:shadow-md",
        isDragging && "z-10 rotate-1 opacity-70 shadow-lg"
      )}
    >
      <div className="flex items-center justify-between">
        {prioridad ? (
          <div className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", PRIORIDAD_DOT[prioridad])} />
            <span className="text-[11px] font-medium text-muted-foreground capitalize">{prioridad}</span>
          </div>
        ) : <span />}
        <span className="text-[11px] font-bold text-primary">🎯 {score}</span>
      </div>

      <div className="flex items-start gap-1.5">
        <Link
          href={`${basePath}/${comprador.id}`}
          onClick={(e) => isDragging && e.preventDefault()}
          className="block font-semibold leading-tight hover:text-primary hover:underline flex-1"
        >
          {comprador.nombre}
        </Link>
        {incompletos.length > 0 && (
          <span
            title={`Faltan: ${incompletos.join(", ")}`}
            className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500"
          />
        )}
      </div>

      {(comprador.presupuesto_max || comprador.presupuesto_min) && (
        <p className="text-xs font-medium text-muted-foreground">
          💰 {fmtEuro(comprador.presupuesto_max ?? comprador.presupuesto_min)}
        </p>
      )}

      {zona && <p className="text-xs text-muted-foreground">📍 {zona}</p>}

      {proxima && (
        <p className={cn("text-xs", esVencida ? "text-red-600 font-semibold dark:text-red-400" : "text-muted-foreground")}>
          📅 {proxima}
        </p>
      )}

      {nombreAgente && (
        <p className="text-[11px] text-muted-foreground">👤 {nombreAgente}</p>
      )}
    </div>
  );
}

function Columna({
  estado,
  items,
  agentes,
  zonas,
  basePath,
}: {
  estado: string;
  items: Comprador[];
  agentes: Record<string, string>;
  zonas: Record<string, string>;
  basePath: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-[calc(100vh-16rem)] w-60 shrink-0 flex-col rounded-xl border-2 bg-muted/20 transition-colors",
        COL_COLOR[estado],
        isOver && "bg-primary/10 ring-2 ring-primary/30"
      )}
    >
      <div className="px-3 py-2.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", COL_DOT[estado])} />
          <span className={cn("text-xs font-bold uppercase tracking-wide", COL_HEADER[estado])}>
            {ETIQUETAS_ESTADO_COMPRADOR[estado]}
          </span>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {items.map((c) => (
          <Tarjeta key={c.id} comprador={c} agentes={agentes} zonas={zonas} basePath={basePath} />
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground/40">Sin registros</p>
        )}
      </div>
    </div>
  );
}

export function KanbanCompradores({
  compradores,
  agentes,
  zonas,
  basePath = "/inmobiliaria/compradores",
}: {
  compradores: Comprador[];
  agentes: Record<string, string>;
  zonas: Record<string, string>;
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
      <div className="flex gap-3 overflow-x-auto pb-4">
        {ESTADOS_COMPRADOR.map((estado) => (
          <Columna
            key={estado}
            estado={estado}
            items={items.filter((c) => c.estado === estado)}
            agentes={agentes}
            zonas={zonas}
            basePath={basePath}
          />
        ))}
      </div>
      <DragOverlay>
        {activo ? <Tarjeta comprador={activo} agentes={agentes} zonas={zonas} basePath={basePath} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
