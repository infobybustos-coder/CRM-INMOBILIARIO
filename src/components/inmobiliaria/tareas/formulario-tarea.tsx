"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActualizarTareaState } from "@/app/inmobiliaria/tareas/actions";

type Agente = { id: string; nombre_completo: string };

export function FormularioTarea({
  tarea,
  agentes,
  actualizarTareaAction,
}: {
  tarea: {
    titulo: string;
    asignado_a: string | null;
    fecha_vencimiento: string | null;
    prioridad: string;
    descripcion: string | null;
  };
  agentes: Agente[];
  actualizarTareaAction: (
    prevState: ActualizarTareaState,
    formData: FormData
  ) => Promise<ActualizarTareaState>;
}) {
  const [state, formAction, pending] = useActionState(actualizarTareaAction, null);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border p-4">
      <div className="space-y-2">
        <label htmlFor="titulo" className="text-sm font-medium">
          Nombre de la tarea
        </label>
        <input
          id="titulo"
          name="titulo"
          defaultValue={tarea.titulo}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="asignado_a" className="text-sm font-medium">
            Responsable
          </label>
          <select
            id="asignado_a"
            name="asignado_a"
            defaultValue={tarea.asignado_a ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Sin asignar</option>
            {agentes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre_completo}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="fecha_vencimiento" className="text-sm font-medium">
            Fecha límite
          </label>
          <input
            type="date"
            id="fecha_vencimiento"
            name="fecha_vencimiento"
            defaultValue={tarea.fecha_vencimiento ? tarea.fecha_vencimiento.slice(0, 10) : ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="prioridad" className="text-sm font-medium">
            Prioridad
          </label>
          <select
            id="prioridad"
            name="prioridad"
            defaultValue={tarea.prioridad}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="descripcion" className="text-sm font-medium">
          Notas
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={tarea.descripcion ?? ""}
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
