"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, User, UserCog, Eye, CheckCheck, CalendarClock, X } from "lucide-react";
import { marcarRealizada, cancelarEvento, reprogramarEvento } from "@/app/inmobiliaria/agenda/actions";
import { ETIQUETA_TIPO_EVENTO, EMOJI_TIPO_EVENTO } from "@/app/inmobiliaria/agenda/constantes";
import { cn } from "@/lib/utils";

export type EventoFila = {
  id: string;
  tipo: string;
  fecha_hora: string;
  estado: string;
  confirmado: boolean | null;
  relacionadoCon: string | null;
  hrefRelacionado: string | null;
  nombreAsesor: string | null;
};

function estadoVisual(e: EventoFila): { label: string; color: string } {
  if (e.estado === "completado") return { label: "Realizada", color: "bg-emerald-500/10 text-emerald-600" };
  if (e.estado === "cancelado") return { label: "Cancelada", color: "bg-rose-500/10 text-rose-600" };
  if (e.confirmado) return { label: "Confirmada", color: "bg-sky-500/10 text-sky-600" };
  return { label: "Pendiente", color: "bg-amber-500/10 text-amber-600" };
}

function aInputFecha(fecha: string) {
  const d = new Date(fecha);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function aInputHora(fecha: string) {
  const d = new Date(fecha);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Fila({ evento }: { evento: EventoFila }) {
  const [pending, startTransition] = useTransition();
  const [reprogramando, setReprogramando] = useState(false);
  const [fecha, setFecha] = useState(aInputFecha(evento.fecha_hora));
  const [hora, setHora] = useState(aInputHora(evento.fecha_hora));
  const estado = estadoVisual(evento);
  const fechaHora = new Date(evento.fecha_hora);
  const vencida = fechaHora < new Date() && evento.estado === "pendiente";

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
          {fechaHora.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
          {" · "}
          {fechaHora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 font-medium">
        <span>{EMOJI_TIPO_EVENTO[evento.tipo] ?? "📌"}</span>
        {ETIQUETA_TIPO_EVENTO[evento.tipo] ?? evento.tipo}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {evento.relacionadoCon && (
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" /> {evento.relacionadoCon}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <UserCog className="size-3.5" /> {evento.nombreAsesor ?? "Sin asignar"}
        </span>
      </div>

      {evento.estado === "pendiente" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => marcarRealizada(evento.id))}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-500/10"
          >
            <CheckCheck className="size-3.5" /> Marcar como realizada
          </button>
          <button
            type="button"
            onClick={() => setReprogramando((v) => !v)}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-sky-600 hover:bg-sky-500/10"
          >
            <CalendarClock className="size-3.5" /> Reprogramar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => cancelarEvento(evento.id))}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-rose-600 hover:bg-rose-500/10"
          >
            <X className="size-3.5" /> Cancelar
          </button>
          {evento.hrefRelacionado && (
            <Link
              href={evento.hrefRelacionado}
              className="ml-auto flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              <Eye className="size-3.5" /> Ver ficha relacionada
            </Link>
          )}
        </div>
      )}

      {reprogramando && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-muted/40 p-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-xs"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-xs"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await reprogramarEvento(evento.id, `${fecha}T${hora}`);
                setReprogramando(false);
              })
            }
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

export function Tabla({ eventos }: { eventos: EventoFila[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay eventos registrados.</p>;
  }

  return (
    <div className="space-y-2">
      {eventos.map((e) => (
        <Fila key={e.id} evento={e} />
      ))}
    </div>
  );
}
