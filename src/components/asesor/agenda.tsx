"use client";

import { Phone, Home, ClipboardCheck, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Evento = {
  id: string;
  tipo: string;
  titulo: string;
  fecha_hora: string;
  estado: string;
};

const ICONO_TIPO: Record<string, typeof Phone> = {
  llamada: Phone,
  visita: Home,
  tasacion: ClipboardCheck,
  recordatorio: Bell,
};

const ETIQUETA_TIPO: Record<string, string> = {
  llamada: "Llamada",
  visita: "Visita",
  tasacion: "Tasación",
  recordatorio: "Recordatorio",
};

export function Agenda({
  eventos,
  actualizarEstadoEventoAction,
}: {
  eventos: Evento[];
  actualizarEstadoEventoAction: (id: string, estado: string) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">Próximos eventos</h2>
      <div className="space-y-2">
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes eventos próximos.</p>
        ) : (
          eventos.map((e) => {
            const Icono = ICONO_TIPO[e.tipo] ?? Bell;
            const completado = e.estado === "completado";
            const cancelado = e.estado === "cancelado";
            const vencido = !completado && !cancelado && new Date(e.fecha_hora) < new Date();

            return (
              <div
                key={e.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-sm",
                  completado && "opacity-60",
                  cancelado && "opacity-40",
                  vencido && "border-red-500/60"
                )}
              >
                <Icono className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className={cn("font-medium", completado && "line-through")}>{e.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {ETIQUETA_TIPO[e.tipo] ?? e.tipo} ·{" "}
                    {new Date(e.fecha_hora).toLocaleString("es-ES", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    {vencido && " · ⚠ vencido"}
                  </p>
                </div>
                {!completado && !cancelado && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => actualizarEstadoEventoAction(e.id, "completado")}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      Hecho
                    </button>
                    <button
                      type="button"
                      onClick={() => actualizarEstadoEventoAction(e.id, "cancelado")}
                      className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
