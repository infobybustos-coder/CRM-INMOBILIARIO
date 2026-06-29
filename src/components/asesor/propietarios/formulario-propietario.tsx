"use client";

import { useActionState } from "react";
import {
  ESTADOS_PROPIETARIO,
  ETIQUETAS_ESTADO,
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  type Propietario,
} from "@/app/asesor/propietarios/constantes";
import { actualizarPropietario } from "@/app/asesor/propietarios/actions";
import { Button } from "@/components/ui/button";

function aFechaInput(fecha: string | null) {
  if (!fecha) return "";
  return fecha.slice(0, 10);
}

export function FormularioPropietario({ propietario }: { propietario: Propietario }) {
  const accion = actualizarPropietario.bind(null, propietario.id);
  const [state, formAction, pending] = useActionState(accion, null);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            defaultValue={propietario.nombre}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="telefono" className="text-sm font-medium">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            defaultValue={propietario.telefono}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={propietario.email ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="whatsapp" className="text-sm font-medium">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            defaultValue={propietario.whatsapp ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="direccion" className="text-sm font-medium">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            defaultValue={propietario.direccion ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="tipo_inmueble" className="text-sm font-medium">
            Tipo de inmueble
          </label>
          <select
            id="tipo_inmueble"
            name="tipo_inmueble"
            defaultValue={propietario.tipo_inmueble ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Sin especificar</option>
            {TIPOS_INMUEBLE.map((t) => (
              <option key={t} value={t}>
                {ETIQUETAS_TIPO_INMUEBLE[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="estado" className="text-sm font-medium">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={propietario.estado}
            disabled
            className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
          >
            {ESTADOS_PROPIETARIO.map((e) => (
              <option key={e} value={e}>
                {ETIQUETAS_ESTADO[e]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Cambia el estado desde la vista Kanban.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="valor_estimado" className="text-sm font-medium">
            Valor estimado (€)
          </label>
          <input
            id="valor_estimado"
            name="valor_estimado"
            type="number"
            defaultValue={propietario.valor_estimado ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fecha_ultimo_contacto" className="text-sm font-medium">
            Último contacto
          </label>
          <input
            id="fecha_ultimo_contacto"
            name="fecha_ultimo_contacto"
            type="date"
            defaultValue={aFechaInput(propietario.fecha_ultimo_contacto)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fecha_proxima_accion" className="text-sm font-medium">
            Próxima acción
          </label>
          <input
            id="fecha_proxima_accion"
            name="fecha_proxima_accion"
            type="date"
            defaultValue={aFechaInput(propietario.fecha_proxima_accion)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="notas" className="text-sm font-medium">
            Notas generales
          </label>
          <textarea
            id="notas"
            name="notas"
            rows={3}
            defaultValue={propietario.notas ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      {state && "ok" in state && <p className="text-sm text-green-500">Guardado.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
