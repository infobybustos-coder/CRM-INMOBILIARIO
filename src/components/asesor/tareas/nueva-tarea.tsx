"use client";

import { useActionState, useRef } from "react";
import { Plus } from "lucide-react";
import { crearTareaGeneral } from "@/app/asesor/tareas/actions";
import { Button } from "@/components/ui/button";

export function NuevaTarea() {
  const [state, formAction, pending] = useActionState(crearTareaGeneral, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <label htmlFor="titulo" className="text-xs font-medium text-muted-foreground">
          Nueva tarea
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          placeholder="¿Qué tienes que hacer?"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="fecha_vencimiento" className="text-xs font-medium text-muted-foreground">
          Fecha límite
        </label>
        <input
          id="fecha_vencimiento"
          name="fecha_vencimiento"
          type="date"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
        />
      </div>
      <Button type="submit" disabled={pending} className="gap-1.5">
        <Plus className="size-4" />
        {pending ? "Añadiendo..." : "Añadir"}
      </Button>
      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
