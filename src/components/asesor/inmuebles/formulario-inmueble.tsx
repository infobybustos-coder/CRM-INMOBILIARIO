"use client";

import { useActionState } from "react";
import {
  ESTADOS_INMUEBLE,
  ETIQUETAS_ESTADO_INMUEBLE,
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  type Inmueble,
  type Zona,
  type PropietarioMini,
} from "@/app/asesor/inmuebles/constantes";
import { actualizarInmueble, crearZona } from "@/app/asesor/inmuebles/actions";
import { Button } from "@/components/ui/button";
import { ZonaSelector } from "@/components/asesor/zona-selector";

function aFechaInput(fecha: string | null) {
  if (!fecha) return "";
  return fecha.slice(0, 10);
}

export function FormularioInmueble({
  inmueble,
  zonas,
  propietarios,
}: {
  inmueble: Inmueble;
  zonas: Zona[];
  propietarios: PropietarioMini[];
}) {
  const accion = actualizarInmueble.bind(null, inmueble.id);
  const [state, formAction, pending] = useActionState(accion, null);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="referencia" className="text-sm font-medium">
            Referencia
          </label>
          <input
            id="referencia"
            name="referencia"
            defaultValue={inmueble.referencia ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="direccion" className="text-sm font-medium">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            defaultValue={inmueble.direccion}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="propietario_id" className="text-sm font-medium">
            Propietario
          </label>
          <select
            id="propietario_id"
            name="propietario_id"
            defaultValue={inmueble.propietario_id ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Sin especificar</option>
            {propietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
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
            defaultValue={inmueble.estado}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {ESTADOS_INMUEBLE.map((e) => (
              <option key={e} value={e}>
                {ETIQUETAS_ESTADO_INMUEBLE[e]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="tipo" className="text-sm font-medium">
            Tipo de inmueble
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={inmueble.tipo ?? ""}
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
          <label htmlFor="precio" className="text-sm font-medium">
            Precio (€)
          </label>
          <input
            id="precio"
            name="precio"
            type="number"
            defaultValue={inmueble.precio ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="metros_cuadrados" className="text-sm font-medium">
            Metros cuadrados
          </label>
          <input
            id="metros_cuadrados"
            name="metros_cuadrados"
            type="number"
            defaultValue={inmueble.metros_cuadrados ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="habitaciones" className="text-sm font-medium">
            Habitaciones
          </label>
          <input
            id="habitaciones"
            name="habitaciones"
            type="number"
            defaultValue={inmueble.habitaciones ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="banos" className="text-sm font-medium">
            Baños
          </label>
          <input
            id="banos"
            name="banos"
            type="number"
            defaultValue={inmueble.banos ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="certificado_energetico" className="text-sm font-medium">
            Certificado energético
          </label>
          <input
            id="certificado_energetico"
            name="certificado_energetico"
            defaultValue={inmueble.certificado_energetico ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="fecha_publicacion" className="text-sm font-medium">
            Fecha de publicación
          </label>
          <input
            id="fecha_publicacion"
            name="fecha_publicacion"
            type="date"
            defaultValue={aFechaInput(inmueble.fecha_publicacion)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <ZonaSelector
            zonas={zonas}
            zonaSeleccionada={inmueble.zona_id}
            crearZonaAction={crearZona}
            name="zona_id"
            label="Zona"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="descripcion" className="text-sm font-medium">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            defaultValue={inmueble.descripcion ?? ""}
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
