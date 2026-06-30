"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { claveDia, type AgendaItem } from "@/lib/agenda";

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
}: {
  itemsPorDia: Record<string, AgendaItem[]>;
  compacto?: boolean;
}) {
  const hoy = new Date();
  const [cursor, setCursor] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() });
  const [seleccionado, setSeleccionado] = useState<string | null>(
    compacto ? null : claveDia(hoy)
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
    <div className={cn("rounded-lg border p-3", compacto ? "text-xs" : "text-sm")}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium">
          {MESES[cursor.month]} {cursor.year}
        </span>
        {!compacto && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              className="rounded-md p-1 hover:bg-accent"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              className="rounded-md p-1 hover:bg-accent"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
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
                        "size-1.5 rounded-full",
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
        <div className="mt-3 space-y-1 border-t pt-3">
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
        </div>
      )}
    </div>
  );
}
