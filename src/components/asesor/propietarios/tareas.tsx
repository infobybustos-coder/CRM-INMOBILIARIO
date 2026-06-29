"use client";

import { useActionState } from "react";
import { crearTarea, alternarTarea } from "@/app/asesor/propietarios/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: string;
};

export function Tareas({
  propietarioId,
  tareas,
}: {
  propietarioId: string;
  tareas: Tarea[];
}) {
  const accion = crearTarea.bind(null, propietarioId);
  const [state, formAction, pending] = useActionState(accion, null);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Tareas</h2>

      <form action={formAction} className="flex flex-wrap gap-2">
        <input
          name="titulo"
          placeholder="Nueva tarea..."
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <input
          name="fecha_vencimiento"
          type="date"
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Añadiendo..." : "Añadir"}
        </Button>
      </form>
      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="space-y-2 border-t pt-3">
        {tareas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas todavía.</p>
        ) : (
          tareas.map((t) => {
            const completada = t.estado === "completada";
            return (
              <label
                key={t.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  defaultChecked={completada}
                  onChange={(e) =>
                    alternarTarea(t.id, propietarioId, e.target.checked)
                  }
                  className="accent-primary"
                />
                <span className={cn(completada && "text-muted-foreground line-through")}>
                  {t.titulo}
                </span>
                {t.fecha_vencimiento && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.fecha_vencimiento).toLocaleDateString("es-ES")}
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
