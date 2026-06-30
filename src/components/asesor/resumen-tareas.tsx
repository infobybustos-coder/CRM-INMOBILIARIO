import { CheckCircle2, AlertTriangle } from "lucide-react";
import { itemsDeHoy, itemsVencidos, type AgendaItem } from "@/lib/agenda";

export function ResumenTareas({ items }: { items: AgendaItem[] }) {
  const hoy = itemsDeHoy(items);
  const vencidos = itemsVencidos(items);

  if (hoy.length === 0 && vencidos.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-emerald-500/10 p-4 text-sm text-emerald-600">
        <CheckCircle2 className="size-5 shrink-0" />
        <p>No tienes nada pendiente para hoy. ¡Vas al día!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tareas pendientes
      </p>
      {hoy.length > 0 && (
        <p className="text-sm">
          <span className="font-semibold">Hoy: </span>
          {hoy.map((i) => i.titulo).join(", ")}.
        </p>
      )}
      {vencidos.length > 0 && (
        <p className="flex items-start gap-2 text-sm text-red-500">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-semibold">
              Tienes {vencidos.length} pendiente{vencidos.length > 1 ? "s" : ""} atrasado
              {vencidos.length > 1 ? "s" : ""}:{" "}
            </span>
            {vencidos.map((i) => i.titulo).join(", ")}.
          </span>
        </p>
      )}
    </div>
  );
}
