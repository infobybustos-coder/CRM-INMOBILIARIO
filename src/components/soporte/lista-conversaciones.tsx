import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { BadgeEstado } from "./badge-estado";
import type { Conversacion } from "@/lib/soporte/tipos";

function fecha(valor: string) {
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function ListaConversaciones({
  conversaciones,
  baseHref,
  seleccionadaId,
  className,
}: {
  conversaciones: Conversacion[];
  baseHref: string;
  seleccionadaId?: string;
  className?: string;
}) {
  if (conversaciones.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 p-8 text-center", className)}>
        <MessageCircleQuestion className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Todavía no tienes conversaciones con soporte.</p>
      </div>
    );
  }

  return (
    <div className={cn("divide-y overflow-y-auto", className)}>
      {conversaciones.map((c) => (
        <Link
          key={c.id}
          href={`${baseHref}?c=${c.id}`}
          className={cn(
            "block px-4 py-3 transition-colors hover:bg-accent/60",
            seleccionadaId === c.id && "bg-accent"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{c.asunto}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground">{fecha(c.actualizadoEn)}</span>
          </div>
          <BadgeEstado estado={c.estado} className="mt-1.5" />
        </Link>
      ))}
    </div>
  );
}
