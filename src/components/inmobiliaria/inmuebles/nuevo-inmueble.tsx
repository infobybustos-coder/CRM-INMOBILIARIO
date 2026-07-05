"use client";

import { useActionState, useState } from "react";
import { Plus, X, Tag, MapPin } from "lucide-react";
import { crearInmuebleRapido } from "@/app/asesor/inmuebles/actions";
import { Button } from "@/components/ui/button";

export function NuevoInmueble({
  children,
}: {
  children?: (abrir: () => void) => React.ReactNode;
} = {}) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(crearInmuebleRapido, null);
  const [stateProcesado, setStateProcesado] = useState(state);

  if (state !== stateProcesado) {
    setStateProcesado(state);
    if (state && "ok" in state) setAbierto(false);
  }

  return (
    <>
      {children ? (
        children(() => setAbierto(true))
      ) : (
        <Button type="button" onClick={() => setAbierto(true)} className="gap-1.5">
          <Plus className="size-4" />
          Nuevo inmueble
        </Button>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-sm space-y-5 rounded-t-2xl border bg-card p-6 shadow-2xl md:rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Nuevo inmueble</h2>
                <p className="text-xs text-muted-foreground">
                  Alta rápida. Podrás completar el resto y asignar asesor luego.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="referencia" className="text-sm font-medium">
                  Referencia
                </label>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="referencia"
                    name="referencia"
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej. CV57588"
                    className="w-full rounded-md border bg-background py-2 pr-3 pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="direccion" className="text-sm font-medium">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    required
                    className="w-full rounded-md border bg-background py-2 pr-3 pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="precio" className="text-sm font-medium">
                  Precio (opcional)
                </label>
                <input
                  id="precio"
                  name="precio"
                  type="number"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              {state && "error" in state && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Guardando..." : "Guardar"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
