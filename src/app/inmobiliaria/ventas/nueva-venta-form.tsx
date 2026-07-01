"use client";

import { useActionState, useState } from "react";
import { crearVenta } from "./actions";
import { Plus, X } from "lucide-react";

export function NuevaVentaForm({
  inmuebles,
  compradores,
}: {
  inmuebles: { id: string; direccion: string }[];
  compradores: { id: string; nombre: string }[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_: unknown, fd: FormData) => {
      const r = await crearVenta(fd);
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
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" />
        Nueva venta
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Registrar venta</h3>
        <button type="button" onClick={() => setAbierto(false)}>
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Inmueble</label>
            <select name="inmueble_id" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">— Seleccionar —</option>
              {inmuebles.map((i) => (
                <option key={i.id} value={i.id}>{i.direccion}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Comprador</label>
            <select name="comprador_id" className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">— Seleccionar —</option>
              {compradores.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Precio de venta (€)</label>
            <input
              name="precio_venta"
              type="number"
              min={1}
              step={1000}
              placeholder="185000"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Comisión (%)</label>
            <input
              name="comision_porcentaje"
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="3"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea
              name="notas"
              rows={2}
              placeholder="Condiciones especiales, plazos..."
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
            {pending ? "Guardando..." : "Registrar en fase de Reserva"}
          </button>
          <button type="button" onClick={() => setAbierto(false)} className="rounded-lg border px-4 py-2 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
