"use client";

import { useActionState } from "react";
import { actualizarVisita } from "./actions";
import { CheckCircle2, Clock, XCircle, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const ETIQUETAS_RESULTADO: Record<string, string> = {
  interesado: "Interesado",
  no_interesado: "No interesado",
  oferta: "Quiere hacer oferta",
  pendiente: "Pendiente evaluar",
};

const COLORES_RESULTADO: Record<string, string> = {
  interesado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  no_interesado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  oferta: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
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
};

export function FilaVisita({
  visita,
  nombreEntidad,
}: {
  visita: Visita;
  nombreEntidad: string | null;
}) {
  const [, formAction, pending] = useActionState(
    (_: unknown, fd: FormData) => actualizarVisita(fd),
    null
  );

  const fecha = new Date(visita.fecha_hora);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  const esPasada = fecha < hoy;

  return (
    <div className="bg-card px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {visita.estado === "completado" ? (
            <CheckCircle2 className="size-5 text-emerald-500" />
          ) : visita.estado === "cancelado" ? (
            <XCircle className="size-5 text-red-500" />
          ) : (
            <Clock className={cn("size-5", esPasada ? "text-red-400" : "text-amber-500")} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium">{visita.titulo}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              <span className={cn(esHoy && "font-semibold text-primary")}>
                {esHoy ? "Hoy · " : ""}
                {fecha.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                {fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {nombreEntidad && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {nombreEntidad}
            </p>
          )}

          {visita.descripcion && (
            <p className="mt-1 text-sm text-muted-foreground">{visita.descripcion}</p>
          )}

          {/* Confirmation + result for pending */}
          {visita.estado === "pendiente" && (
            <div className="mt-2 flex flex-wrap gap-2">
              <form action={formAction} className="inline">
                <input type="hidden" name="id" value={visita.id} />
                <input type="hidden" name="confirmado" value={String(!visita.confirmado)} />
                <button
                  type="submit"
                  disabled={pending}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    visita.confirmado
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {visita.confirmado ? "✓ Confirmada" : "Confirmar visita"}
                </button>
              </form>

              <form action={formAction} className="inline">
                <input type="hidden" name="id" value={visita.id} />
                <input type="hidden" name="estado" value="completado" />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                >
                  Marcar realizada
                </button>
              </form>

              <form action={formAction} className="inline">
                <input type="hidden" name="id" value={visita.id} />
                <input type="hidden" name="estado" value="cancelado" />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                >
                  Cancelar
                </button>
              </form>
            </div>
          )}

          {/* Result for completed */}
          {visita.estado === "completado" && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {visita.resultado ? (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    COLORES_RESULTADO[visita.resultado] ?? "bg-muted text-muted-foreground"
                  )}
                >
                  {ETIQUETAS_RESULTADO[visita.resultado] ?? visita.resultado}
                </span>
              ) : (
                <form action={formAction} className="flex flex-wrap gap-1">
                  <input type="hidden" name="id" value={visita.id} />
                  <p className="w-full text-xs text-muted-foreground mb-1">Resultado de la visita:</p>
                  {Object.entries(ETIQUETAS_RESULTADO).map(([val, label]) => (
                    <button
                      key={val}
                      type="submit"
                      name="resultado"
                      value={val}
                      disabled={pending}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium border hover:opacity-80",
                        COLORES_RESULTADO[val]
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </form>
              )}
              {visita.nota_resultado && (
                <p className="w-full text-xs text-muted-foreground mt-1">{visita.nota_resultado}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
