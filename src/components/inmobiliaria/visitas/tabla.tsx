"use client";

import { useTransition } from "react";
import { CalendarDays, Home, User, UserCog, Check, X, CheckCheck } from "lucide-react";
import { confirmarVisita, actualizarEstadoVisita } from "@/app/inmobiliaria/visitas/actions";
import { cn } from "@/lib/utils";

export type VisitaFila = {
  id: string;
  fecha_hora: string;
  estado: string;
  confirmado: boolean | null;
  direccionInmueble: string;
  nombreComprador: string;
  nombreAsesor: string | null;
};

function estadoVisual(v: VisitaFila): { label: string; color: string } {
  if (v.estado === "completado") return { label: "Realizada", color: "bg-emerald-500/10 text-emerald-600" };
  if (v.estado === "cancelado") return { label: "Cancelada", color: "bg-rose-500/10 text-rose-600" };
  if (v.confirmado) return { label: "Confirmada", color: "bg-sky-500/10 text-sky-600" };
  return { label: "Pendiente", color: "bg-amber-500/10 text-amber-600" };
}

function Fila({ visita }: { visita: VisitaFila }) {
  const [pending, startTransition] = useTransition();
  const estado = estadoVisual(visita);
  const fecha = new Date(visita.fecha_hora);
  const vencida = fecha < new Date() && visita.estado === "pendiente";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        vencida ? "border-red-500/40 bg-red-500/5" : "hover:bg-accent/40"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", estado.color)}>
          {estado.label}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {fecha.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
          {" · "}
          {fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 font-medium">
        <Home className="size-4 text-muted-foreground" />
        {visita.direccionInmueble}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="size-3.5" /> {visita.nombreComprador}
        </span>
        <span className="flex items-center gap-1.5">
          <UserCog className="size-3.5" /> {visita.nombreAsesor ?? "Sin asignar"}
        </span>
      </div>

      {visita.estado === "pendiente" && (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {!visita.confirmado && (
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => confirmarVisita(visita.id, true))}
              className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-sky-600 hover:bg-sky-500/10"
            >
              <Check className="size-3.5" /> Confirmar
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => actualizarEstadoVisita(visita.id, "completado"))}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-500/10"
          >
            <CheckCheck className="size-3.5" /> Marcar realizada
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => actualizarEstadoVisita(visita.id, "cancelado"))}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-rose-600 hover:bg-rose-500/10"
          >
            <X className="size-3.5" /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

export function Tabla({ visitas }: { visitas: VisitaFila[] }) {
  if (visitas.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay visitas registradas.</p>;
  }

  return (
    <div className="space-y-2">
      {visitas.map((v) => (
        <Fila key={v.id} visita={v} />
      ))}
    </div>
  );
}
