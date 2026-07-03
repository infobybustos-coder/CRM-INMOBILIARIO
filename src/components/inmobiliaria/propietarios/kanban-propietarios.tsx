"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ETIQUETAS_ESTADO_PROPIETARIO,
} from "@/app/inmobiliaria/constantes";
import { actualizarEstadoPropietarioInmobiliaria } from "@/app/inmobiliaria/propietarios/actions";
import { PanelPropietario, type PropietarioPanel } from "./panel-propietario";
import { cn } from "@/lib/utils";

type Propietario = PropietarioPanel & {
  direccion: string | null;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
};

type Agente = { id: string; nombre_completo: string };

const COL_BORDER: Record<string, string> = {
  nuevo_lead:          "border-sky-400/50",
  contactado:          "border-cyan-400/50",
  tasacion_programada: "border-amber-400/50",
  tasacion_realizada:  "border-orange-400/50",
  negociacion:         "border-violet-400/50",
  exclusiva_firmada:   "border-indigo-400/50",
  captado:             "border-emerald-400/50",
  perdido:             "border-rose-400/50",
};
const COL_BG: Record<string, string> = {
  nuevo_lead:          "bg-sky-50/60      dark:bg-sky-950/20",
  contactado:          "bg-cyan-50/60     dark:bg-cyan-950/20",
  tasacion_programada: "bg-amber-50/60    dark:bg-amber-950/20",
  tasacion_realizada:  "bg-orange-50/60   dark:bg-orange-950/20",
  negociacion:         "bg-violet-50/60   dark:bg-violet-950/20",
  exclusiva_firmada:   "bg-indigo-50/60   dark:bg-indigo-950/20",
  captado:             "bg-emerald-50/60  dark:bg-emerald-950/20",
  perdido:             "bg-rose-50/60     dark:bg-rose-950/20",
};
const COL_HEADER: Record<string, string> = {
  nuevo_lead:          "text-sky-700      dark:text-sky-400",
  contactado:          "text-cyan-700     dark:text-cyan-400",
  tasacion_programada: "text-amber-700    dark:text-amber-400",
  tasacion_realizada:  "text-orange-700   dark:text-orange-400",
  negociacion:         "text-violet-700   dark:text-violet-400",
  exclusiva_firmada:   "text-indigo-700   dark:text-indigo-400",
  captado:             "text-emerald-700  dark:text-emerald-400",
  perdido:             "text-rose-700     dark:text-rose-400",
};
const COL_DOT: Record<string, string> = {
  nuevo_lead:          "bg-sky-500",
  contactado:          "bg-cyan-500",
  tasacion_programada: "bg-amber-500",
  tasacion_realizada:  "bg-orange-500",
  negociacion:         "bg-violet-500",
  exclusiva_firmada:   "bg-indigo-500",
  captado:             "bg-emerald-500",
  perdido:             "bg-rose-500",
};
const CARD_BG: Record<string, string> = {
  nuevo_lead:          "bg-sky-100/80     dark:bg-sky-900/30  border-sky-200     dark:border-sky-800",
  contactado:          "bg-cyan-100/80    dark:bg-cyan-900/30 border-cyan-200    dark:border-cyan-800",
  tasacion_programada: "bg-amber-100/80   dark:bg-amber-900/30 border-amber-200  dark:border-amber-800",
  tasacion_realizada:  "bg-orange-100/80  dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
  negociacion:         "bg-violet-100/80  dark:bg-violet-900/30 border-violet-200 dark:border-violet-800",
  exclusiva_firmada:   "bg-indigo-100/80  dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800",
  captado:             "bg-emerald-100/80 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
  perdido:             "bg-rose-100/80    dark:bg-rose-900/30  border-rose-200    dark:border-rose-800",
};
const PRIORIDAD_DOT: Record<string, string> = {
  alta:  "bg-red-500",
  media: "bg-amber-400",
  baja:  "bg-emerald-400",
};

function fmtContacto(fecha: string | null) {
  const dias = diasDesde(fecha);
  if (dias === null) return "Sin contactar";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return `Hace ${dias}d`;
}

function fmtProxima(fecha: string | null) {
  if (!fecha) return null;
  const d = new Date(fecha);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - hoy.getTime()) / 86400000);
  if (diff < 0) return { txt: `⚠ Hace ${Math.abs(diff)}d`, vencida: true };
  if (diff === 0) return { txt: "Hoy", vencida: false };
  if (diff === 1) return { txt: "Mañana", vencida: false };
  return { txt: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), vencida: false };
}

// ── Tarjeta ────────────────────────────────────────────────
function Tarjeta({
  propietario,
  agentes,
  onAbrir,
  overlay = false,
}: {
  propietario: Propietario;
  agentes: Record<string, string>;
  onAbrir: (p: Propietario) => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id: propietario.id,
  });

  const prioridad = calcularPrioridad(propietario);
  const score = calcularCaptacionScore(propietario);
  const nombreAgente = propietario.agente_id
    ? (agentes[propietario.agente_id] ?? "").split(" ")[0]
    : null;
  const proxResult = fmtProxima(propietario.fecha_proxima_accion);

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      onClick={() => { if (!isDragging) onAbrir(propietario); }}
      className={cn(
        "relative select-none touch-none rounded-xl border shadow-sm transition-all duration-150",
        "cursor-pointer hover:shadow-md hover:brightness-95",
        CARD_BG[propietario.estado] ?? "bg-card border-border",
        isDragging && !overlay && "opacity-40",
        overlay && "rotate-1 shadow-xl scale-105",
      )}
    >
      {/* Área de arrastre — cubre toda la tarjeta, debajo del contenido */}
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-xl"
      />
      {/* Contenido — encima del área de arrastre */}
      <div className="relative p-3 space-y-2 pointer-events-none">
        <div className="flex items-center justify-between">
          {prioridad ? (
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", PRIORIDAD_DOT[prioridad])} />
              <span className="text-[11px] font-semibold text-muted-foreground capitalize">
                {prioridad}
              </span>
            </div>
          ) : <span />}
          <span className="text-[11px] font-bold text-primary">🎯 {score}</span>
        </div>

        <p className="font-semibold text-sm leading-tight">{propietario.nombre}</p>

        {propietario.direccion && (
          <p className="text-xs text-muted-foreground line-clamp-1">📍 {propietario.direccion}</p>
        )}

        {proxResult && (
          <p className={cn("text-xs", proxResult.vencida
            ? "text-red-600 font-semibold dark:text-red-400"
            : "text-muted-foreground"
          )}>
            📅 {proxResult.txt}
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 border-t border-black/5 dark:border-white/5">
          {nombreAgente ? <span>👤 {nombreAgente}</span> : <span />}
          <span>⏱ {fmtContacto(propietario.fecha_ultimo_contacto)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Columna ────────────────────────────────────────────────
function Columna({
  estado,
  items,
  agentes,
  onAbrir,
}: {
  estado: string;
  items: Propietario[];
  agentes: Record<string, string>;
  onAbrir: (p: Propietario) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-[calc(100vh-15rem)] w-64 shrink-0 flex-col rounded-xl border-2 transition-colors",
        COL_BG[estado],
        COL_BORDER[estado],
        isOver && "ring-2 ring-primary/40 brightness-95"
      )}
    >
      <div className="px-3 py-2.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", COL_DOT[estado])} />
          <span className={cn("text-xs font-bold uppercase tracking-wide", COL_HEADER[estado])}>
            {ETIQUETAS_ESTADO_PROPIETARIO[estado]}
          </span>
        </div>
        <span className="rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-[11px] font-semibold">
          {items.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {items.map((p) => (
          <Tarjeta key={p.id} propietario={p} agentes={agentes} onAbrir={onAbrir} />
        ))}
        {items.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground/40">Sin registros</p>
        )}
      </div>
    </div>
  );
}

// ── KanbanPropietarios ─────────────────────────────────────
export function KanbanPropietarios({
  propietarios,
  agentes,
  agentesArray = [],
  tenantId = "",
}: {
  propietarios: Propietario[];
  agentes: Record<string, string>;
  agentesArray?: Agente[];
  tenantId?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(propietarios);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelPropietario, setPanelPropietario] = useState<Propietario | null>(null);
  const [toast, setToast] = useState<"guardado" | "error" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const id = String(active.id);
    const nuevoEstado = String(over.id);
    const actual = items.find((p) => p.id === id);
    if (!actual || actual.estado === nuevoEstado) return;

    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)));

    try {
      await actualizarEstadoPropietarioInmobiliaria(id, nuevoEstado);
      setToast("guardado");
      router.refresh();
    } catch {
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, estado: actual.estado } : p)));
      setToast("error");
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }

  const activo = activeId ? items.find((p) => p.id === activeId) ?? null : null;

  return (
    <>
      {toast && (
        <div className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-xl",
          toast === "guardado" ? "bg-emerald-600" : "bg-red-600"
        )}>
          {toast === "guardado" ? "✓ Estado guardado" : "✗ Error al guardar"}
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ESTADOS_PROPIETARIO.map((estado) => (
            <Columna
              key={estado}
              estado={estado}
              items={items.filter((p) => p.estado === estado)}
              agentes={agentes}
              onAbrir={setPanelPropietario}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activo ? (
            <Tarjeta propietario={activo} agentes={agentes} onAbrir={() => {}} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <PanelPropietario
        propietario={panelPropietario}
        agentes={agentesArray}
        tenantId={tenantId}
        onClose={() => setPanelPropietario(null)}
      />
    </>
  );
}
