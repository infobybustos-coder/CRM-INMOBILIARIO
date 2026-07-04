"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Zona = { id: string; nombre: string; ciudad: string | null };
type ZonaState = { error: string } | { ok: true; zona: Zona } | null;

export function ZonaSelector({
  zonas,
  zonaSeleccionada,
  crearZonaAction,
  name = "zona_id",
  label = "Zona",
}: {
  zonas: Zona[];
  zonaSeleccionada: string | null;
  crearZonaAction: (prevState: ZonaState, formData: FormData) => Promise<ZonaState>;
  name?: string;
  label?: string;
}) {
  const [lista, setLista] = useState(zonas);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccion, setSeleccion] = useState(zonaSeleccionada ?? "");
  const [state, formAction, pending] = useActionState<ZonaState, FormData>(crearZonaAction, null);
  const [stateProcesado, setStateProcesado] = useState(state);
  const nombreRef = useRef<HTMLInputElement>(null);
  const ciudadRef = useRef<HTMLInputElement>(null);
  const provinciaRef = useRef<HTMLInputElement>(null);

  if (state !== stateProcesado) {
    setStateProcesado(state);
    if (state && "ok" in state) {
      setLista((prev) => [...prev, state.zona]);
      setSeleccion(state.zona.id);
      setMostrarForm(false);
    }
  }

  function crearZona() {
    const formData = new FormData();
    formData.set("nombre", nombreRef.current?.value ?? "");
    formData.set("ciudad", ciudadRef.current?.value ?? "");
    formData.set("provincia_estado", provinciaRef.current?.value ?? "");
    formAction(formData);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <select
          id={name}
          name={name}
          value={seleccion}
          onChange={(e) => setSeleccion(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Sin especificar</option>
          {lista.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre}
              {z.ciudad ? ` (${z.ciudad})` : ""}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={() => setMostrarForm((v) => !v)}>
          + Nueva
        </Button>
      </div>

      {mostrarForm && (
        <div className="space-y-2 rounded-md border p-3">
          {/* No es un <form>: este selector vive dentro del formulario grande
              de la ficha, y los formularios anidados no son válidos en HTML. */}
          <input
            ref={nombreRef}
            name="nombre"
            placeholder="Nombre de la zona"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <input
            ref={ciudadRef}
            name="ciudad"
            placeholder="Ciudad (opcional)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <input
            ref={provinciaRef}
            name="provincia_estado"
            placeholder="Provincia (opcional)"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {state && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="button" size="sm" onClick={crearZona} disabled={pending}>
            {pending ? "Creando..." : "Crear zona"}
          </Button>
        </div>
      )}
    </div>
  );
}
