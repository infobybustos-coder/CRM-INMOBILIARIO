"use client";

import { useActionState } from "react";
import {
  ESTADOS_COMPRADOR,
  ETIQUETAS_ESTADO_COMPRADOR,
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  TIPOS_FINANCIACION,
  ETIQUETAS_FINANCIACION,
  NIVELES_URGENCIA,
  ETIQUETAS_URGENCIA,
  type Comprador,
  type Zona,
} from "@/app/asesor/compradores/constantes";
import { actualizarComprador, crearZona } from "@/app/asesor/compradores/actions";
import { Button } from "@/components/ui/button";
import { ZonaSelector } from "@/components/asesor/zona-selector";
import { useMoneda } from "@/lib/preferencias";

function aFechaInput(fecha: string | null) {
  if (!fecha) return "";
  return fecha.slice(0, 10);
}

export function FormularioComprador({
  comprador,
  zonas,
}: {
  comprador: Comprador;
  zonas: Zona[];
}) {
  const accion = actualizarComprador.bind(null, comprador.id);
  const [state, formAction, pending] = useActionState(accion, null);
  const { simbolo } = useMoneda();

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
            defaultValue={comprador.nombre}
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
            defaultValue={comprador.telefono ?? ""}
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
            defaultValue={comprador.email ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="estado" className="text-sm font-medium">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={comprador.estado}
            disabled
            className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
          >
            {ESTADOS_COMPRADOR.map((e) => (
              <option key={e} value={e}>
                {ETIQUETAS_ESTADO_COMPRADOR[e]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Cambia el estado desde la vista Kanban.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="presupuesto_min" className="text-sm font-medium">
            Presupuesto mínimo ({simbolo})
          </label>
          <input
            id="presupuesto_min"
            name="presupuesto_min"
            type="number"
            defaultValue={comprador.presupuesto_min ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="presupuesto_max" className="text-sm font-medium">
            Presupuesto máximo ({simbolo})
          </label>
          <input
            id="presupuesto_max"
            name="presupuesto_max"
            type="number"
            defaultValue={comprador.presupuesto_max ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="tipo_inmueble" className="text-sm font-medium">
            Tipo de inmueble buscado
          </label>
          <select
            id="tipo_inmueble"
            name="tipo_inmueble"
            defaultValue={comprador.tipo_inmueble ?? ""}
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
          <label htmlFor="financiacion" className="text-sm font-medium">
            Financiación
          </label>
          <select
            id="financiacion"
            name="financiacion"
            defaultValue={comprador.financiacion ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Sin especificar</option>
            {TIPOS_FINANCIACION.map((f) => (
              <option key={f} value={f}>
                {ETIQUETAS_FINANCIACION[f]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="urgencia" className="text-sm font-medium">
            Urgencia
          </label>
          <select
            id="urgencia"
            name="urgencia"
            defaultValue={comprador.urgencia}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {NIVELES_URGENCIA.map((u) => (
              <option key={u} value={u}>
                {ETIQUETAS_URGENCIA[u]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <ZonaSelector
            zonas={zonas}
            zonaSeleccionada={comprador.zona_buscada_id}
            crearZonaAction={crearZona}
            name="zona_buscada_id"
            label="Zona buscada"
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
            defaultValue={aFechaInput(comprador.fecha_ultimo_contacto)}
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
            defaultValue={aFechaInput(comprador.fecha_proxima_accion)}
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
            defaultValue={comprador.notas ?? ""}
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
