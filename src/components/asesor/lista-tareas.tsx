"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TareaItem = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: string;
  entidad_tipo: string;
  entidad_nombre: string | null;
  entidad_href: string;
};

const ETIQUETA_TIPO: Record<string, string> = {
  propietario: "Propietario",
  comprador: "Comprador",
  inmueble: "Inmueble",
};

export function ListaTareas({
  items,
  alternarTareaAction,
}: {
  items: TareaItem[];
  alternarTareaAction: (tareaId: string, completada: boolean) => Promise<void>;
}) {
  const [completadas, setCompletadas] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((t) => [t.id, t.estado === "completada"]))
  );

  function alternar(id: string, valor: boolean) {
    setCompletadas((prev) => ({ ...prev, [id]: valor }));
    alternarTareaAction(id, valor);
  }

  const pendientes = items.filter((t) => !completadas[t.id]);
  const hechas = items.filter((t) => completadas[t.id]);

  function fila(t: TareaItem) {
    const completada = completadas[t.id];
    const vencida =
      !completada && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < new Date();

    return (
      <div
        key={t.id}
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
          completada && "opacity-60",
          vencida && "border-red-500/60"
        )}
      >
        <button
          type="button"
          onClick={() => alternar(t.id, !completada)}
          aria-label={completada ? "Marcar como pendiente" : "Marcar como hecha"}
          className="shrink-0"
        >
          <CheckCircle2
            className={cn(
              "size-6 transition-colors",
              completada ? "fill-emerald-500 text-emerald-500" : "text-muted-foreground"
            )}
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium", completada && "line-through")}>{t.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {t.entidad_nombre ? (
              <Link href={t.entidad_href} className="underline">
                {ETIQUETA_TIPO[t.entidad_tipo] ?? t.entidad_tipo}: {t.entidad_nombre}
              </Link>
            ) : (
              ETIQUETA_TIPO[t.entidad_tipo] ?? t.entidad_tipo
            )}
            {t.fecha_vencimiento && (
              <>
                {" · "}
                <span className={vencida ? "font-semibold text-destructive" : undefined}>
                  {new Date(t.fecha_vencimiento).toLocaleDateString("es-ES")}
                  {vencida && " (vencida)"}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        No tienes tareas creadas. Añádelas desde la ficha de un propietario, comprador o inmueble.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Pendientes ({pendientes.length})
        </h2>
        {pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes tareas pendientes. ¡Vas al día!</p>
        ) : (
          <div className="space-y-2">{pendientes.map(fila)}</div>
        )}
      </div>

      {hechas.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Hechas ({hechas.length})</h2>
          <div className="space-y-2">{hechas.map(fila)}</div>
        </div>
      )}
    </div>
  );
}
