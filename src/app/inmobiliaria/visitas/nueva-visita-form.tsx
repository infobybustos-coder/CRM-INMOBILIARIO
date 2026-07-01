"use client";

import { useActionState, useState } from "react";
import { crearVisita } from "./actions";
import { Plus, X } from "lucide-react";

export function NuevaVisitaForm() {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_: unknown, fd: FormData) => {
      const r = await crearVisita(fd);
      if (r && "ok" in r) setAbierto(false);
      return r;
    },
    null
  );

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="size-4" />
        Programar visita
      </button>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Nueva visita</h3>
        <button type="button" onClick={() => setAbierto(false)}>
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Título *</label>
            <input
              name="titulo"
              required
              placeholder="ej. Visita piso C/ Gran Vía 12"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha y hora *</label>
            <input
              name="fecha_hora"
              type="datetime-local"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo de entidad</label>
            <select
              name="entidad_tipo"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">— Sin vincular —</option>
              <option value="inmueble">Inmueble</option>
              <option value="propietario">Propietario</option>
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea
              name="descripcion"
              rows={2}
              placeholder="Detalles de la visita..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        {state && "error" in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Guardando..." : "Guardar visita"}
          </button>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
