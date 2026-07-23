"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { crearVisita } from "@/app/inmobiliaria/visitas/actions";
import { Button } from "@/components/ui/button";

type Opcion = { id: string; etiqueta: string };

export function NuevaVisita({
  inmuebles,
  compradores,
  asesores = [],
  gestor = false,
  children,
}: {
  inmuebles: Opcion[];
  compradores: Opcion[];
  asesores?: Opcion[];
  gestor?: boolean;
  children?: (abrir: () => void) => React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(crearVisita, null);
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
          Nueva visita
        </Button>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-sm space-y-5 rounded-t-2xl border bg-card p-6 shadow-2xl md:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nueva visita</h2>
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
                <label htmlFor="inmueble_id" className="text-sm font-medium">
                  Inmueble
                </label>
                <select
                  id="inmueble_id"
                  name="inmueble_id"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecciona un inmueble</option>
                  {inmuebles.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="comprador_id" className="text-sm font-medium">
                  Comprador
                </label>
                <select
                  id="comprador_id"
                  name="comprador_id"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecciona un comprador</option>
                  {compradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="fecha" className="text-sm font-medium">
                    Fecha
                  </label>
                  <input
                    id="fecha"
                    name="fecha"
                    type="date"
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="hora" className="text-sm font-medium">
                    Hora
                  </label>
                  <input
                    id="hora"
                    name="hora"
                    type="time"
                    required
                    defaultValue="10:00"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {gestor && (
                <div className="space-y-1.5">
                  <label htmlFor="asesor_id" className="text-sm font-medium">
                    Asesor (opcional)
                  </label>
                  <select
                    id="asesor_id"
                    name="asesor_id"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {asesores.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {state && "error" in state && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Guardando..." : "Programar visita"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
