"use client";

import { useTransition } from "react";
import { alternarEstadoColaborador } from "@/app/superadmin/colaboraciones/actions";
import { cn } from "@/lib/utils";
import type { EstadoColaborador } from "@/lib/colaboraciones/tipos";

export function ColaboradorEstadoBoton({ id, estado }: { id: string; estado: EstadoColaborador }) {
  const [pending, startTransition] = useTransition();
  const nuevoEstado: EstadoColaborador = estado === "activo" ? "inactivo" : "activo";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => alternarEstadoColaborador(id, nuevoEstado))}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
      )}
    >
      {pending ? "Guardando..." : estado === "activo" ? "Marcar como inactivo" : "Marcar como activo"}
    </button>
  );
}
