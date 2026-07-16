import Link from "next/link";
import { cn } from "@/lib/utils";
import { BadgeEstado } from "@/components/soporte/badge-estado";
import type { ConversacionConCliente } from "@/lib/soporte/tipos";

function fecha(valor: string) {
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function ListaConversacionesAdmin({
  conversaciones,
  seleccionadaId,
  hrefBase,
  className,
}: {
  conversaciones: ConversacionConCliente[];
  seleccionadaId?: string;
  hrefBase: string;
  className?: string;
}) {
  if (conversaciones.length === 0) {
    return (
      <div className={cn("p-8 text-center text-sm text-muted-foreground", className)}>
        No hay conversaciones que coincidan con el filtro.
      </div>
    );
  }

  return (
    <div className={cn("divide-y overflow-y-auto", className)}>
      {conversaciones.map((c) => (
        <Link
          key={c.id}
          href={`${hrefBase}${c.id}`}
          className={cn(
            "block px-4 py-3 transition-colors hover:bg-accent/60",
            seleccionadaId === c.id && "bg-accent"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{c.clienteNombre}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground">{fecha(c.actualizadoEn)}</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{c.asunto}</p>
          <BadgeEstado estado={c.estado} className="mt-1.5" />
        </Link>
      ))}
    </div>
  );
}
