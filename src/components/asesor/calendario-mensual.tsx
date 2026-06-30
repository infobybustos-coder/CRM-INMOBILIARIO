"use client";

import { useActionState, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { claveDia, type AgendaItem } from "@/lib/agenda";

type EventoState = { error: string } | null;

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function obtenerDiasMes(year: number, month: number): (Date | null)[] {
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const inicioOffset = (primerDia.getDay() + 6) % 7;
  const dias: (Date | null)[] = [];
  for (let i = 0; i < inicioOffset; i++) dias.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(year, month, d));
  return dias;
}

export function CalendarioMensual({
  itemsPorDia,
  compacto = false,
  crearEventoAction,
}: {
  itemsPorDia: Record<string, AgendaItem[]>;
  compacto?: boolean;
  crearEventoAction?: (prevState: EventoState, formData: FormData) => Promise<EventoState>;
}) {
  const hoy = new Date();
  const [cursor, setCursor] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() });
  const [seleccionado, setSeleccionado] = useState<string | null>(
    compacto ? null : claveDia(hoy)
  );
  const [state, formAction, pending] = useActionState(
    crearEventoAction ?? (async () => null),
    null
  );

  const dias = obtenerDiasMes(cursor.year, cursor.month);
  const claveHoy = claveDia(hoy);
  const itemsSeleccionado = seleccionado ? itemsPorDia[seleccionado] ?? [] : [];

  function cambiarMes(delta: number) {
    setCursor((prev) => {
      const nuevo = new Date(prev.year, prev.month + delta, 1);
      return { year: nuevo.getFullYear(), month: nuevo.getMonth() };
    });
  }

  return (
    <div className={cn("rounded-lg border p-2", compacto ? "text-[10px]" : "max-w-sm text-xs")}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-medium">
          {MESES[cursor.month]} {cursor.year}
        </span>
        {!compacto && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              className="rounded-md p-0.5 hover:bg-accent"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              className="rounded-md p-0.5 hover:bg-accent"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-muted-foreground">
            {d}
          </div>
        ))}
        {dias.map((dia, idx) => {
          if (!dia) return <div key={idx} />;
          const clave = claveDia(dia);
          const items = itemsPorDia[clave] ?? [];
          const esHoy = clave === claveHoy;
          const seleccionadoActivo = clave === seleccionado;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => !compacto && setSeleccionado(clave)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border",
                esHoy && "border-primary",
                seleccionadoActivo && !compacto && "bg-primary/10",
                !compacto && "hover:bg-accent"
              )}
            >
              <span className={cn(esHoy && "font-semibold text-primary")}>{dia.getDate()}</span>
              {items.length > 0 && (
                <span className="flex gap-0.5">
                  {items.slice(0, 3).map((it, i) => (
                    <span
                      key={i}
                      className={cn(
                        "size-1 rounded-full",
                        it.estado === "completado" || it.estado === "completada"
                          ? "bg-emerald-500"
                          : new Date(it.fecha) < hoy
                            ? "bg-red-500"
                            : "bg-primary"
                      )}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!compacto && (
        <div className="mt-2 space-y-1 border-t pt-2">
          <p className="text-xs font-medium text-muted-foreground">
            {seleccionado
              ? new Date(`${seleccionado}T00:00:00`).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "Selecciona un día"}
          </p>
          {itemsSeleccionado.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nada para este día.</p>
          ) : (
            itemsSeleccionado.map((it) => (
              <div
                key={`${it.origen}-${it.id}`}
                className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1 text-xs"
              >
                <span>{it.titulo}</span>
                <span className="text-muted-foreground">
                  {new Date(it.fecha).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}

          {crearEventoAction && seleccionado && (
            <form action={formAction} className="mt-1 flex items-center gap-1">
              <input type="hidden" name="tipo" value="recordatorio" />
              <input type="hidden" name="fecha_hora" value={`${seleccionado}T09:00`} />
              <input
                name="titulo"
                placeholder="Añadir tarea rápida..."
                required
                className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-xs"
              />
              <button
                type="submit"
                disabled={pending}
                aria-label="Añadir tarea"
                className="flex shrink-0 items-center justify-center rounded-md bg-primary p-1.5 text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="size-3.5" />
              </button>
            </form>
          )}
          {state && "error" in state && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
