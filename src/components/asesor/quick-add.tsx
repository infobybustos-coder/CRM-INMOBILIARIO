"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, X, User, Phone, MapPin, Mail, Home, Tag } from "lucide-react";
import { crearClienteRapido } from "@/app/asesor/clientes/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tipo = "propietario" | "comprador" | "inmueble";

const TIPO_POR_SECCION: Record<string, Tipo> = {
  "/asesor/propietarios": "propietario",
  "/asesor/compradores": "comprador",
  "/asesor/inmuebles": "inmueble",
};

export function QuickAdd() {
  const pathname = usePathname();
  const tipoFijo = Object.entries(TIPO_POR_SECCION).find(([ruta]) =>
    pathname?.startsWith(ruta)
  )?.[1];

  const [abierto, setAbierto] = useState(false);
  const [mostrarMas, setMostrarMas] = useState(false);
  const [tipoElegido, setTipoElegido] = useState<Tipo>("propietario");
  const tipo = tipoFijo ?? tipoElegido;
  const setTipo = setTipoElegido;
  const [state, formAction, pending] = useActionState(crearClienteRapido, null);
  const [stateProcesado, setStateProcesado] = useState(state);

  if (state !== stateProcesado) {
    setStateProcesado(state);
    if (state && "ok" in state) {
      setAbierto(false);
      setMostrarMas(false);
      setTipoElegido("propietario");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={
          tipoFijo === "inmueble"
            ? "Añadir inmueble"
            : tipoFijo === "comprador"
              ? "Añadir comprador"
              : tipoFijo === "propietario"
                ? "Añadir propietario"
                : "Añadir cliente"
        }
        className={cn(
          "fixed right-4 bottom-20 z-50 flex size-14 items-center justify-center",
          "rounded-full bg-primary text-primary-foreground shadow-lg",
          "md:right-8 md:bottom-8"
        )}
      >
        <Plus className="size-6" />
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-sm space-y-5 rounded-t-2xl border bg-card p-6 shadow-2xl md:rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {tipo === "inmueble"
                    ? "Añadir inmueble"
                    : tipo === "comprador"
                      ? "Añadir comprador"
                      : "Añadir propietario"}
                </h2>
                <p className="text-xs text-muted-foreground">Alta rápida, completa el resto luego.</p>
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
              {tipoFijo ? (
                <input type="hidden" name="tipo" value={tipo} />
              ) : (
                <fieldset className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted p-1">
                  {(
                    [
                      { valor: "propietario", etiqueta: "Propietario" },
                      { valor: "comprador", etiqueta: "Comprador" },
                      { valor: "inmueble", etiqueta: "Inmueble" },
                    ] as const
                  ).map((opcion) => (
                    <label
                      key={opcion.valor}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                        tipo === opcion.valor
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground"
                      )}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        value={opcion.valor}
                        checked={tipo === opcion.valor}
                        onChange={() => setTipo(opcion.valor)}
                        className="sr-only"
                      />
                      {opcion.etiqueta}
                    </label>
                  ))}
                </fieldset>
              )}

              {tipo === "inmueble" ? (
                <>
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
                </>
              ) : (
                <>
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

                  {tipo === "propietario" && (
                    <div className="space-y-1.5">
                      <label htmlFor="direccion_propietario" className="text-sm font-medium">
                        Dirección
                      </label>
                      <div className="relative">
                        <Home className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="direccion_propietario"
                          name="direccion"
                          type="text"
                          required
                          className="w-full rounded-md border bg-background py-2 pr-3 pl-9 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {mostrarMas ? (
                tipo === "inmueble" ? (
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
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email (opcional)
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="w-full rounded-md border bg-background py-2 pr-3 pl-9 text-sm"
                      />
                    </div>
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setMostrarMas(true)}
                  className="text-sm text-muted-foreground underline underline-offset-2"
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
