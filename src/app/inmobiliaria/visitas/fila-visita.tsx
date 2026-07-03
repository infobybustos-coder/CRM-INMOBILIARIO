"use client";

import { useActionState } from "react";
import { actualizarVisita } from "./actions";
import { cn } from "@/lib/utils";

const ESTADO_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pendiente:  { label: "Pendiente",  dot: "bg-amber-400",   bg: "bg-amber-50  dark:bg-amber-950/30",  text: "text-amber-700  dark:text-amber-400"  },
  completado: { label: "Realizada",  dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400" },
  cancelado:  { label: "Cancelada",  dot: "bg-rose-500",    bg: "bg-rose-50   dark:bg-rose-950/30",   text: "text-rose-700   dark:text-rose-400"   },
};

const RESULTADO_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  interesado:    { label: "Interesado",       bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  no_interesado: { label: "No interesado",    bg: "bg-rose-100    dark:bg-rose-900/30",    text: "text-rose-700    dark:text-rose-400"    },
  oferta:        { label: "Quiere hacer oferta", bg: "bg-blue-100  dark:bg-blue-900/30",   text: "text-blue-700    dark:text-blue-400"    },
  pendiente:     { label: "Por evaluar",      bg: "bg-amber-100   dark:bg-amber-900/30",   text: "text-amber-700   dark:text-amber-400"   },
};

type Visita = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_hora: string;
  estado: string;
  confirmado: boolean | null;
  resultado: string | null;
  nota_resultado: string | null;
  entidad_tipo: string | null;
  entidad_id: string | null;
  usuario_id: string | null;
};

function fmtFecha(iso: string) {
  const d = new Date(iso);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  const dia = new Date(d); dia.setHours(0, 0, 0, 0);

  let prefijo = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  if (dia.getTime() === hoy.getTime()) prefijo = "Hoy";
  else if (dia.getTime() === manana.getTime()) prefijo = "Mañana";
  else if (dia.getTime() === ayer.getTime()) prefijo = "Ayer";

  const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return { prefijo, hora, esHoy: dia.getTime() === hoy.getTime(), esPasada: d < new Date() };
}

export function FilaVisita({
  visita,
  nombreInmueble,
  nombreCliente,
  nombreAgente,
}: {
  visita: Visita;
  nombreInmueble: string | null;
  nombreCliente: string | null;
  nombreAgente: string | null;
}) {
  const [, formAction, pending] = useActionState(
    (_: unknown, fd: FormData) => actualizarVisita(fd),
    null
  );

  const { prefijo, hora, esHoy, esPasada } = fmtFecha(visita.fecha_hora);
  const estadoCfg = ESTADO_CONFIG[visita.estado] ?? ESTADO_CONFIG.pendiente;
  const esPendiente = visita.estado === "pendiente";
  const esCompletada = visita.estado === "completado";
  const vencida = esPendiente && esPasada;

  return (
    <div className={cn(
      "group flex gap-4 px-4 py-3.5 transition-colors hover:bg-muted/30",
      vencida && "border-l-2 border-rose-400"
    )}>
      {/* Columna fecha — ancho fijo */}
      <div className="w-24 shrink-0 text-right">
        <p className={cn(
          "text-sm font-semibold leading-tight",
          esHoy ? "text-primary" : vencida ? "text-rose-600 dark:text-rose-400" : "text-foreground"
        )}>
          {prefijo}
        </p>
        <p className="text-xs text-muted-foreground">{hora}</p>
      </div>

      {/* Separador vertical */}
      <div className="flex flex-col items-center">
        <span className={cn("mt-1.5 size-2.5 rounded-full shrink-0", estadoCfg.dot)} />
        <span className="mt-1 w-px flex-1 bg-border" />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 pb-1">
        {/* Fila 1 — título + estado */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-tight">{visita.titulo}</p>
          <div className="flex items-center gap-2">
            {visita.confirmado && esPendiente && (
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                ✓ Confirmada
              </span>
            )}
            <span className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              estadoCfg.bg, estadoCfg.text
            )}>
              {estadoCfg.label}
            </span>
          </div>
        </div>

        {/* Fila 2 — inmueble + cliente + agente */}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          {nombreInmueble && (
            <span>🏡 {nombreInmueble}</span>
          )}
          {nombreCliente && (
            <span>👤 {nombreCliente}</span>
          )}
          {nombreAgente && (
            <span>👨‍💼 {nombreAgente}</span>
          )}
        </div>

        {visita.descripcion && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{visita.descripcion}</p>
        )}

        {/* Resultado si está completada */}
        {esCompletada && visita.resultado && (
          <span className={cn(
            "mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            RESULTADO_CONFIG[visita.resultado]?.bg,
            RESULTADO_CONFIG[visita.resultado]?.text
          )}>
            {RESULTADO_CONFIG[visita.resultado]?.label ?? visita.resultado}
          </span>
        )}

        {/* Acciones inline — solo pendientes */}
        {esPendiente && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {!visita.confirmado && (
              <form action={formAction}>
                <input type="hidden" name="id" value={visita.id} />
                <input type="hidden" name="confirmado" value="true" />
                <button disabled={pending} className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium hover:bg-accent transition-colors">
                  Confirmar
                </button>
              </form>
            )}
            <form action={formAction}>
              <input type="hidden" name="id" value={visita.id} />
              <input type="hidden" name="estado" value="completado" />
              <button disabled={pending} className="rounded-full border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors">
                Marcar realizada
              </button>
            </form>
            <form action={formAction}>
              <input type="hidden" name="id" value={visita.id} />
              <input type="hidden" name="estado" value="cancelado" />
              <button disabled={pending} className="rounded-full border border-rose-300 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors">
                Cancelar
              </button>
            </form>
          </div>
        )}

        {/* Registrar resultado — completada sin resultado aún */}
        {esCompletada && !visita.resultado && (
          <form action={formAction} className="mt-1.5 flex flex-wrap gap-1">
            <input type="hidden" name="id" value={visita.id} />
            <p className="w-full text-[11px] text-muted-foreground">Resultado:</p>
            {Object.entries(RESULTADO_CONFIG).map(([val, cfg]) => (
              <button
                key={val}
                type="submit"
                name="resultado"
                value={val}
                disabled={pending}
                className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium hover:opacity-80 transition-opacity", cfg.bg, cfg.text)}
              >
                {cfg.label}
              </button>
            ))}
          </form>
        )}
      </div>
    </div>
  );
}
