"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BotonEliminar({
  id,
  mensaje,
  eliminarAction,
  className,
}: {
  id: string;
  mensaje: string;
  eliminarAction: (id: string) => Promise<void>;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Eliminar"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(mensaje)) {
          startTransition(() => eliminarAction(id));
        }
      }}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
        className
      )}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
