"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ResultadoState } from "@/app/inmobiliaria/agenda/actions";

export function ResultadoForm({
  notaResultado,
  descripcion,
  actualizarResultadoAction,
}: {
  notaResultado: string | null;
  descripcion: string | null;
  actualizarResultadoAction: (
    prevState: ResultadoState,
    formData: FormData
  ) => Promise<ResultadoState>;
}) {
  const [state, formAction, pending] = useActionState(actualizarResultadoAction, null);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border p-4">
      <div className="space-y-2">
        <label htmlFor="resultado" className="text-sm font-medium">
          Resultado
        </label>
        <input
          id="resultado"
          name="resultado"
          defaultValue={notaResultado ?? ""}
          placeholder="Ej. Interesado, seguir en 3 días"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="notas" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={4}
          defaultValue={descripcion ?? ""}
          placeholder="Detalles adicionales de la cita..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      {state && "ok" in state && <p className="text-sm text-green-500">Guardado.</p>}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
