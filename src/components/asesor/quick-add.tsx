"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { crearClienteRapido } from "@/app/asesor/clientes/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickAdd() {
  const [abierto, setAbierto] = useState(false);
  const [mostrarMas, setMostrarMas] = useState(false);
  const [tipo, setTipo] = useState<"propietario" | "comprador" | "inmueble">("propietario");
  const [state, formAction, pending] = useActionState(crearClienteRapido, null);
  const [stateProcesado, setStateProcesado] = useState(state);

  if (state !== stateProcesado) {
    setStateProcesado(state);
    if (state && "ok" in state) {
      setAbierto(false);
      setMostrarMas(false);
      setTipo("propietario");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Añadir cliente"
        className={cn(
          "fixed right-4 bottom-20 z-50 flex size-14 items-center justify-center",
          "rounded-full bg-primary text-primary-foreground shadow-lg",
          "md:right-8 md:bottom-8"
        )}
      >
        <Plus className="size-6" />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center">
          <div className="w-full max-w-sm space-y-4 rounded-t-2xl bg-card p-6 md:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {tipo === "inmueble" ? "Añadir inmueble" : "Añadir cliente"}
              </h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <fieldset className="flex gap-2">
                <label className="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="tipo"
                    value="propietario"
                    checked={tipo === "propietario"}
                    onChange={() => setTipo("propietario")}
                    className="accent-primary"
                  />
                  Propietario
                </label>
                <label className="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="tipo"
                    value="comprador"
                    checked={tipo === "comprador"}
                    onChange={() => setTipo("comprador")}
                    className="accent-primary"
                  />
                  Comprador
                </label>
                <label className="flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="tipo"
                    value="inmueble"
                    checked={tipo === "inmueble"}
                    onChange={() => setTipo("inmueble")}
                    className="accent-primary"
                  />
                  Inmueble
                </label>
              </fieldset>

              {tipo === "inmueble" ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="referencia" className="text-sm font-medium">
                      Referencia
                    </label>
                    <input
                      id="referencia"
                      name="referencia"
                      type="text"
                      required
                      autoFocus
                      placeholder="Ej. CV57588"
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
                      type="text"
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="text-sm font-medium">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      autoFocus
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
                      type="tel"
                      required
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {tipo === "propietario" && (
                    <div className="space-y-2">
                      <label htmlFor="direccion_propietario" className="text-sm font-medium">
                        Dirección
                      </label>
                      <input
                        id="direccion_propietario"
                        name="direccion"
                        type="text"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </>
              )}

              {mostrarMas ? (
                tipo === "inmueble" ? (
                  <div className="space-y-2">
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
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email (opcional)
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setMostrarMas(true)}
                  className="text-sm text-muted-foreground underline"
                >
                  + Añadir más datos
                </button>
              )}

              {state && "error" in state && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Guardando..." : "Guardar"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Podrás completar el resto de datos más tarde.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
