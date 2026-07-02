"use client";

import { useActionState } from "react";
import { crearComprador } from "../actions";

export function NuevoCompradorForm({
  zonas,
}: {
  zonas: { id: string; nombre: string; ciudad: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(crearComprador, null);

  return (
    <form action={formAction} className="space-y-5">
      {state && "error" in state && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Registra el comprador con los datos básicos. Podrás completar presupuesto, zona y preferencias desde la ficha.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre *</label>
          <input
            name="nombre"
            required
            placeholder="Nombre del comprador"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Teléfono</label>
          <input
            name="telefono"
            type="tel"
            placeholder="600 000 000"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Presupuesto máximo (€)</label>
          <input
            name="presupuesto_max"
            type="number"
            min="0"
            step="1000"
            placeholder="300000"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {zonas.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Zona buscada</label>
            <select
              name="zona_buscada_id"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Cualquier zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}{z.ciudad ? ` (${z.ciudad})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Notas rápidas</label>
          <input
            name="notas"
            placeholder="Qué está buscando, observaciones..."
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
          {pending ? "Guardando..." : "Crear comprador"}
        </button>
        <a
          href="/inmobiliaria/compradores"
          className="rounded-md border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
