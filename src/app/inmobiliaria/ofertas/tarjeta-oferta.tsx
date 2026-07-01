"use client";

import { useActionState } from "react";
import { cambiarEstadoOferta } from "./actions";
import { Home, User, Euro } from "lucide-react";

const TRANSICIONES: Record<string, { label: string; siguiente: string; color: string }[]> = {
  pendiente: [
    { label: "En negociación", siguiente: "negociacion", color: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Rechazar", siguiente: "rechazada", color: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" },
  ],
  negociacion: [
    { label: "Contraoferta", siguiente: "contraoferta", color: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400" },
    { label: "Aceptar", siguiente: "aceptada", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { label: "Rechazar", siguiente: "rechazada", color: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" },
  ],
  contraoferta: [
    { label: "Aceptar", siguiente: "aceptada", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { label: "Volver a negociar", siguiente: "negociacion", color: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Rechazar", siguiente: "rechazada", color: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" },
  ],
  aceptada: [],
  rechazada: [],
};

type Oferta = {
  id: string;
  inmueble_id: string | null;
  comprador_id: string | null;
  importe: number;
  estado: string;
  nota: string | null;
  contraoferta_importe: number | null;
  contraoferta_nota: string | null;
  creado_en: string;
};

export function TarjetaOferta({
  oferta,
  inmueble,
  compradorNombre,
}: {
  oferta: Oferta;
  inmueble: { direccion: string; precio: number | null } | null;
  compradorNombre: string | null;
}) {
  const [, formAction, pending] = useActionState(
    (_: unknown, fd: FormData) => cambiarEstadoOferta(fd),
    null
  );

  const transiciones = TRANSICIONES[oferta.estado] ?? [];
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const descuento =
    inmueble?.precio && oferta.importe
      ? Math.round(((inmueble.precio - oferta.importe) / inmueble.precio) * 100)
      : null;

  return (
    <div className="rounded-lg border bg-card p-3 text-sm space-y-2">
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

      <div className="flex items-center gap-2">
        <Euro className="size-4 text-primary" />
        <span className="font-bold text-base">{fmt(oferta.importe)}</span>
        {descuento !== null && descuento > 0 && (
          <span className="rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            -{descuento}%
          </span>
        )}
      </div>

      {oferta.contraoferta_importe && (
        <div className="rounded bg-violet-50 px-2 py-1 dark:bg-violet-900/20">
          <p className="text-xs text-violet-700 dark:text-violet-400">
            Contraoferta: <strong>{fmt(oferta.contraoferta_importe)}</strong>
          </p>
          {oferta.contraoferta_nota && (
            <p className="text-xs text-muted-foreground">{oferta.contraoferta_nota}</p>
          )}
        </div>
      )}

      {oferta.nota && (
        <p className="text-xs text-muted-foreground italic">{oferta.nota}</p>
      )}

      {transiciones.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t pt-2">
          {transiciones.map((t) => (
            <form key={t.siguiente} action={formAction}>
              <input type="hidden" name="id" value={oferta.id} />
              <input type="hidden" name="estado" value={t.siguiente} />
              <button
                type="submit"
                disabled={pending}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${t.color}`}
              >
                {t.label}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
