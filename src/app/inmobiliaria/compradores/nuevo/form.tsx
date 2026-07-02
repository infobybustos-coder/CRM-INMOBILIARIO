"use client";

import { useActionState } from "react";
import { crearComprador } from "../actions";
import {
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/app/asesor/propietarios/constantes";
import {
  NIVELES_URGENCIA,
  ETIQUETAS_URGENCIA,
  TIPOS_FINANCIACION,
  ETIQUETAS_FINANCIACION,
} from "@/app/asesor/compradores/constantes";

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
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Urgencia</label>
          <select
            name="urgencia"
            defaultValue="media"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            {NIVELES_URGENCIA.map((u) => (
              <option key={u} value={u}>{ETIQUETAS_URGENCIA[u]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Presupuesto mínimo (€)</label>
          <input
            name="presupuesto_min"
            type="number"
            min="0"
            step="1000"
            placeholder="150000"
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
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo de inmueble buscado</label>
          <select
            name="tipo_inmueble"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Cualquier tipo</option>
            {TIPOS_INMUEBLE.map((t) => (
              <option key={t} value={t}>{ETIQUETAS_TIPO_INMUEBLE[t]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Financiación</label>
          <select
            name="financiacion"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Sin especificar</option>
            {TIPOS_FINANCIACION.map((f) => (
              <option key={f} value={f}>{ETIQUETAS_FINANCIACION[f]}</option>
            ))}
          </select>
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
          <label className="text-sm font-medium">Notas</label>
          <textarea
            name="notas"
            rows={3}
            placeholder="Requisitos especiales, comentarios..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
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
