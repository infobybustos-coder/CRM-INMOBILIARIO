"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Phone, Home, ClipboardCheck, Bell, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { claveDia, type AgendaItem } from "@/lib/agenda";

type EventoState = { error: string } | null;

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TIPOS_ACCION = [
  { valor: "llamada", etiqueta: "Llamada", icono: Phone, ejemplo: "Llamar a Juan para seguimiento" },
  { valor: "visita", etiqueta: "Visita", icono: Home, ejemplo: "Visita al piso de Calle Mayor" },
  { valor: "tasacion", etiqueta: "Tasación", icono: ClipboardCheck, ejemplo: "Tasación con María" },
  { valor: "recordatorio", etiqueta: "Otro", icono: Bell, ejemplo: "Enviar contrato por email" },
] as const;

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
  grande = false,
  crearEventoAction,
  mesInicial,
}: {
  itemsPorDia: Record<string, AgendaItem[]>;
  compacto?: boolean;
  grande?: boolean;
  crearEventoAction?: (prevState: EventoState, formData: FormData) => Promise<EventoState>;
  mesInicial?: { year: number; month: number };
}) {
  const hoy = new Date();
  const [cursor, setCursor] = useState(mesInicial ?? { year: hoy.getFullYear(), month: hoy.getMonth() });
  const [seleccionado, setSeleccionado] = useState<string | null>(
    compacto ? null : mesInicial ? null : claveDia(hoy)
  );
  const [state, formAction, pending] = useActionState(
    crearEventoAction ?? (async () => null),
    null
  );
  const [tipoSeleccionado, setTipoSeleccionado] = useState<(typeof TIPOS_ACCION)[number]>(
    TIPOS_ACCION[0]
  );
  const [hora, setHora] = useState("09:00");

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
    <div
      className={cn(
        "rounded-lg border",
        grande ? "w-full p-4 text-sm" : compacto ? "p-2 text-[10px]" : "max-w-sm p-2 text-xs"
      )}
    >
      <div className={cn("flex items-center justify-between", grande ? "mb-3" : "mb-1.5")}>
        <span className={cn("font-semibold", grande && "text-lg")}>
          {MESES[cursor.month]} {cursor.year}
        </span>
        {!compacto && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              className={cn("rounded-md hover:bg-accent", grande ? "p-1.5" : "p-0.5")}
              aria-label="Mes anterior"
            >
              <ChevronLeft className={grande ? "size-5" : "size-3.5"} />
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              className={cn("rounded-md hover:bg-accent", grande ? "p-1.5" : "p-0.5")}
              aria-label="Mes siguiente"
            >
              <ChevronRight className={grande ? "size-5" : "size-3.5"} />
            </button>
          </div>
        )}
      </div>

      <div className={cn("grid grid-cols-7", grande ? "gap-1.5" : "gap-0.5")}>
        {DIAS_SEMANA.map((d) => (
          <div key={d} className={cn("text-center text-muted-foreground", grande && "pb-1 font-medium")}>
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
                "flex aspect-square flex-col items-center justify-center rounded-md border",
                grande ? "gap-1" : "gap-0.5",
                esHoy && "border-primary",
                seleccionadoActivo && !compacto && "bg-primary/10",
                !compacto && "hover:bg-accent"
              )}
            >
              <span className={cn(grande && "text-base", esHoy && "font-semibold text-primary")}>
                {dia.getDate()}
              </span>
              {items.length > 0 && (
                <span className={cn("flex", grande ? "gap-1" : "gap-0.5")}>
                  {items.slice(0, 3).map((it, i) => (
                    <span
                      key={i}
                      className={cn(
                        grande ? "size-1.5" : "size-1",
                        "rounded-full",
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
        <div className={cn("space-y-1 border-t", grande ? "mt-3 pt-3" : "mt-2 pt-2")}>
          <p className={cn("font-medium text-muted-foreground", grande ? "text-sm" : "text-xs")}>
            {seleccionado
              ? new Date(`${seleccionado}T00:00:00`).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "Selecciona un día"}
          </p>
          {itemsSeleccionado.length === 0 ? (
            <p className={cn("text-muted-foreground", grande ? "text-sm" : "text-xs")}>
              Nada para este día.
            </p>
          ) : (
            itemsSeleccionado.map((it) => (
              <div
                key={`${it.origen}-${it.id}`}
                className={cn(
                  "rounded-md bg-muted/50",
                  grande ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{it.titulo}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(it.fecha).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {it.href && (
                  <Link
                    href={it.href}
                    className={cn(
                      "mt-1 flex items-center gap-1 text-primary hover:underline",
                      grande ? "text-xs" : "text-[11px]"
                    )}
                  >
                    <Eye className="size-3" /> Abrir ficha
                  </Link>
                )}
              </div>
            ))
          )}

          {crearEventoAction && seleccionado && (
            <form action={formAction} className="mt-2 space-y-1.5 rounded-md border bg-muted/30 p-2">
              <input type="hidden" name="tipo" value={tipoSeleccionado.valor} />
              <input type="hidden" name="fecha_hora" value={`${seleccionado}T${hora}`} />

              <div className="flex gap-1">
                {TIPOS_ACCION.map((t) => {
                  const Icono = t.icono;
                  const activo = t.valor === tipoSeleccionado.valor;
                  return (
                    <button
                      key={t.valor}
                      type="button"
                      onClick={() => setTipoSeleccionado(t)}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-0.5 rounded-md border px-1 py-1",
                        activo ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                      )}
                    >
                      <Icono className="size-3.5" />
                      <span className="text-[9px]">{t.etiqueta}</span>
                    </button>
                  );
                })}
              </div>

              <input
                name="titulo"
                placeholder={tipoSeleccionado.ejemplo}
                required
                className="w-full rounded-md border bg-background px-2 py-1 text-xs"
              />

              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-md bg-primary py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? "Añadiendo..." : "Añadir a la agenda"}
                </button>
              </div>
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
