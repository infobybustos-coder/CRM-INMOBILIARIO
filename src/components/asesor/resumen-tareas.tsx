import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { itemsDeHoy, itemsVencidos, type AgendaItem } from "@/lib/agenda";

export function ResumenTareas({ items }: { items: AgendaItem[] }) {
  const hoy = itemsDeHoy(items);
  const vencidos = itemsVencidos(items);
  const total = hoy.length + vencidos.length;

  if (total === 0) {
    return (
      <Link
        href="/asesor/tareas"
        className="flex items-center gap-2 rounded-lg border bg-emerald-500/10 p-4 text-sm text-emerald-600 transition-colors hover:bg-emerald-500/15"
      >
        <CheckCircle2 className="size-5 shrink-0" />
        <p>No tienes nada pendiente para hoy. ¡Vas al día!</p>
      </Link>
    );
  }

  const lista = [
    ...vencidos.map((i) => ({ ...i, vencida: true })),
    ...hoy.map((i) => ({ ...i, vencida: false })),
  ].slice(0, 3);
  const restantes = total - lista.length;

  return (
    <Link
      href="/asesor/tareas"
      className="block space-y-2 rounded-lg border p-4 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tareas pendientes
        </p>
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold text-white">
          {total}
        </span>
      </div>
      <ul className="space-y-1">
        {lista.map((item) => (
          <li
            key={`${item.origen}-${item.id}`}
            className={cn("text-sm font-medium", item.vencida ? "text-red-600" : "text-amber-600")}
          >
            {item.titulo}
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <p className="text-xs text-muted-foreground">+{restantes} más</p>
      )}
    </Link>
  );
}
