"use client";

import { useActionState } from "react";
import { crearPropietario } from "../actions";

export function NuevaPropietarioForm({
  agentes,
}: {
  agentes: { id: string; nombre_completo: string }[];
}) {
  const [state, formAction, pending] = useActionState(crearPropietario, null);

  return (
    <form action={formAction} className="space-y-5">
      {state && "error" in state && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Rellena los datos mínimos para registrar la captación. Podrás completar el resto desde la ficha.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre *</label>
          <input
            name="nombre"
            required
            placeholder="Nombre del propietario"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Teléfono *</label>
          <input
            name="telefono"
            required
            type="tel"
            placeholder="600 000 000"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Dirección del inmueble</label>
          <input
            name="direccion"
            placeholder="Calle, número, piso..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {agentes.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Asignar a agente</label>
            <select
              name="agente_id"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Sin asignar</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_completo}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Notas rápidas</label>
          <input
            name="notas"
            placeholder="Observación inicial..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Crear captación"}
        </button>
        <a
          href="/inmobiliaria/propietarios"
          className="rounded-md border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
