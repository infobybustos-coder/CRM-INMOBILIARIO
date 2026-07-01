"use client";

import { useActionState } from "react";
import { avanzarEtapaVenta } from "./actions";
import { Home, User, Euro, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Etapa = {
  readonly estado: string;
  readonly label: string;
  readonly paso: number;
  readonly dot: string;
};

type Venta = {
  id: string;
  inmueble_id: string | null;
  comprador_id: string | null;
  precio_venta: number | null;
  comision_porcentaje: number | null;
  comision_importe: number | null;
  estado: string;
  fecha_reserva: string | null;
  fecha_documentacion: string | null;
  fecha_firma: string | null;
  notas: string | null;
};

const SIGUIENTE: Record<string, string> = {
  reserva: "documentacion",
  documentacion: "firma",
  firma: "completada",
};

const ETIQUETA_SIGUIENTE: Record<string, string> = {
  reserva: "→ Documentación",
  documentacion: "→ Firma",
  firma: "→ Completar venta",
};

export function TarjetaVenta({
  venta,
  inmueble,
  compradorNombre,
  etapas,
}: {
  venta: Venta;
  inmueble: { id: string; direccion: string; precio: number | null } | null;
  compradorNombre: string | null;
  etapas: readonly Etapa[];
}) {
  const [, formAction, pending] = useActionState(
    (_: unknown, fd: FormData) => avanzarEtapaVenta(fd),
    null
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const siguienteEstado = SIGUIENTE[venta.estado];
  const etapaActual = etapas.find(e => e.estado === venta.estado);

  return (
    <div className="rounded-lg border bg-card p-3 text-sm space-y-2">
      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {etapas.map((e) => (
          <div
            key={e.estado}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              etapas.findIndex(x => x.estado === venta.estado) >= etapas.findIndex(x => x.estado === e.estado)
                ? e.dot
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {inmueble && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Home className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">{inmueble.direccion}</span>
        </div>
      )}
      {compradorNombre && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="size-3 shrink-0" />
          <span>{compradorNombre}</span>
        </div>
      )}

      {venta.precio_venta && (
        <div className="flex items-center gap-2">
          <Euro className="size-4 text-primary" />
          <span className="font-bold">{fmt(venta.precio_venta)}</span>
          {venta.comision_importe && (
            <span className="rounded bg-emerald-100 px-1.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Comisión: {fmt(venta.comision_importe)}
            </span>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="space-y-0.5 text-[11px] text-muted-foreground">
        {venta.fecha_reserva && (
          <p>Reserva: {new Date(venta.fecha_reserva).toLocaleDateString("es-ES")}</p>
        )}
        {venta.fecha_documentacion && (
          <p>Documentación: {new Date(venta.fecha_documentacion).toLocaleDateString("es-ES")}</p>
        )}
        {venta.fecha_firma && (
          <p>Firma: {new Date(venta.fecha_firma).toLocaleDateString("es-ES")}</p>
        )}
      </div>

      {venta.notas && (
        <p className="text-xs text-muted-foreground italic line-clamp-2">{venta.notas}</p>
      )}

      {siguienteEstado && (
        <form action={formAction} className="border-t pt-2">
          <input type="hidden" name="id" value={venta.id} />
          <input type="hidden" name="estado" value={siguienteEstado} />
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-1 rounded-md bg-primary/10 px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            {ETIQUETA_SIGUIENTE[venta.estado]}
            <ChevronRight className="size-3" />
          </button>
        </form>
      )}

      {venta.estado === "completada" && (
        <div className="border-t pt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          ✓ Venta completada
        </div>
      )}
    </div>
  );
}
