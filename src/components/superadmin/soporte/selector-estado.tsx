"use client";

import { useTransition } from "react";
import { cambiarEstadoConversacion } from "@/app/superadmin/soporte/actions";
import { ESTADOS_CONVERSACION, type EstadoConversacion } from "@/lib/soporte/tipos";

export function SelectorEstado({
  conversacionId,
  estadoActual,
}: {
  conversacionId: string;
  estadoActual: EstadoConversacion;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={estadoActual}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => cambiarEstadoConversacion(conversacionId, e.target.value as EstadoConversacion))
      }
      className="rounded-md border bg-background px-2 py-1 text-xs font-medium disabled:opacity-50"
    >
      {ESTADOS_CONVERSACION.map((e) => (
        <option key={e.valor} value={e.valor}>
          {e.etiqueta}
        </option>
      ))}
    </select>
  );
}
