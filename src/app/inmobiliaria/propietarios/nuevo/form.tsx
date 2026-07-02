"use client";

import { useActionState } from "react";
import { crearPropietario } from "../actions";
import {
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/app/asesor/propietarios/constantes";

const FUENTES = [
  { value: "portal", label: "Portal inmobiliario" },
  { value: "referido", label: "Referido" },
  { value: "redes_sociales", label: "Redes sociales" },
  { value: "buzon", label: "Buzón / Flyer" },
  { value: "web", label: "Web propia" },
  { value: "llamada_fria", label: "Llamada fría" },
  { value: "otro", label: "Otro" },
];

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
          <label className="text-sm font-medium">WhatsApp</label>
          <input
            name="whatsapp"
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
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo de inmueble</label>
          <select
            name="tipo_inmueble"
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
          <label className="text-sm font-medium">Valor estimado (€)</label>
          <input
            name="valor_estimado"
            type="number"
            min="0"
            step="1000"
            placeholder="250000"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fuente del lead</label>
          <select
            name="fuente_lead"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Seleccionar...</option>
            {FUENTES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Próxima acción</label>
          <input
            name="fecha_proxima_accion"
            type="date"
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
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Notas</label>
          <textarea
            name="notas"
            rows={3}
            placeholder="Observaciones sobre la captación..."
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
