"use client";

import { useActionState, useState } from "react";
import { Plus, X, User, Phone, MapPin } from "lucide-react";
import { crearPropietarioRapido } from "@/app/asesor/propietarios/actions";
import { Button } from "@/components/ui/button";

export function NuevoPropietario() {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(crearPropietarioRapido, null);
  const [stateProcesado, setStateProcesado] = useState(state);

  if (state !== stateProcesado) {
    setStateProcesado(state);
    if (state && "ok" in state) setAbierto(false);
  }

  return (
    <>
      <Button type="button" onClick={() => setAbierto(true)} className="gap-1.5">
        <Plus className="size-4" />
        Nuevo propietario
      </Button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-sm space-y-5 rounded-t-2xl border bg-card p-6 shadow-2xl md:rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Nuevo propietario</h2>
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
                <label htmlFor="nombre" className="text-sm font-medium">
                  Nombre
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    autoFocus
                    className="w-full rounded-md border bg-background py-2 pr-3 pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="telefono" className="text-sm font-medium">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    required
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
                    className="w-full rounded-md border bg-background py-2 pr-3 pl-9 text-sm"
                  />
                </div>
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
