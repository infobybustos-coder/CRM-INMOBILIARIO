"use client";

import { useActionState } from "react";
import { crearInmueble } from "../actions";
import {
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/app/asesor/propietarios/constantes";

export function NuevoInmuebleForm({
  zonas,
  propietarios,
}: {
  zonas: { id: string; nombre: string; ciudad: string | null }[];
  propietarios: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(crearInmueble, null);

  return (
    <form action={formAction} className="space-y-5">
      {state && "error" in state && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Dirección *</label>
          <input
            name="direccion"
            required
            placeholder="Calle Mayor 10, 3ºA, Madrid"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Referencia interna</label>
          <input
            name="referencia"
            placeholder="REF-001"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo</label>
          <select
            name="tipo"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Seleccionar...</option>
            {TIPOS_INMUEBLE.map((t) => (
              <option key={t} value={t}>
                {ETIQUETAS_TIPO_INMUEBLE[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Precio (€)</label>
          <input
            name="precio"
            type="number"
            min="0"
            step="1000"
            placeholder="250000"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">m²</label>
          <input
            name="metros_cuadrados"
            type="number"
            min="0"
            placeholder="90"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Habitaciones</label>
          <input
            name="habitaciones"
            type="number"
            min="0"
            max="20"
            placeholder="3"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Baños</label>
          <input
            name="banos"
            type="number"
            min="0"
            max="10"
            placeholder="2"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {zonas.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Zona</label>
            <select
              name="zona_id"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Sin zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}{z.ciudad ? ` (${z.ciudad})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        {propietarios.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Propietario</label>
            <select
              name="propietario_id"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Sin asignar</option>
              {propietarios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Certificado energético</label>
          <select
            name="certificado_energetico"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Sin certificado</option>
            {["A", "B", "C", "D", "E", "F", "G"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fecha de publicación</label>
          <input
            name="fecha_publicacion"
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            rows={3}
            placeholder="Descripción del inmueble..."
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
          {pending ? "Guardando..." : "Crear inmueble"}
        </button>
        <a
          href="/inmobiliaria/inmuebles"
          className="rounded-md border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
