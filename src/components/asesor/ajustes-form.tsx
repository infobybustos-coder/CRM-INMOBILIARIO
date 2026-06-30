"use client";

import { useActionState, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { actualizarAjustes, type AjustesState } from "@/app/asesor/ajustes/actions";

type Tema = "claro" | "oscuro";

function aplicarTema(tema: Tema) {
  document.documentElement.querySelector(".tema-asesor")?.setAttribute("data-tema", tema);
}

export function AjustesForm({
  monedaInicial,
  idiomaInicial,
}: {
  monedaInicial: "EUR" | "USD";
  idiomaInicial: "es" | "en";
}) {
  const [state, formAction, pending] = useActionState<AjustesState, FormData>(
    actualizarAjustes,
    null
  );
  const [moneda, setMoneda] = useState(monedaInicial);
  const [idioma, setIdioma] = useState(idiomaInicial);
  const [tema, setTema] = useState<Tema>(() => {
    if (typeof window === "undefined") return "claro";
    return (localStorage.getItem("tema-asesor") as Tema | null) ?? "claro";
  });

  function elegirTema(nuevo: Tema) {
    setTema(nuevo);
    localStorage.setItem("tema-asesor", nuevo);
    aplicarTema(nuevo);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Apariencia</h2>
        <p className="text-xs text-muted-foreground">Elige cómo quieres ver el CRM.</p>
        <div className="mt-2 flex gap-2">
          {(
            [
              { valor: "claro", etiqueta: "Claro", icono: Sun },
              { valor: "oscuro", etiqueta: "Oscuro", icono: Moon },
            ] as const
          ).map(({ valor, etiqueta, icono: Icono }) => (
            <button
              key={valor}
              type="button"
              onClick={() => elegirTema(valor)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-md border px-3 py-3 text-sm",
                tema === valor
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Icono className="size-4" />
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <div className="space-y-2 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Moneda</h2>
          <p className="text-xs text-muted-foreground">
            Se usará para mostrar precios, valores estimados y presupuestos.
          </p>
          <div className="mt-2 flex gap-2">
            {(
              [
                { valor: "EUR", etiqueta: "Euro (€)" },
                { valor: "USD", etiqueta: "Dólar ($)" },
              ] as const
            ).map(({ valor, etiqueta }) => (
              <label
                key={valor}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm",
                  moneda === valor
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <input
                  type="radio"
                  name="moneda"
                  value={valor}
                  checked={moneda === valor}
                  onChange={() => setMoneda(valor)}
                  className="sr-only"
                />
                {etiqueta}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Idioma</h2>
          <p className="text-xs text-muted-foreground">
            Español e inglés disponibles. (El inglés está en desarrollo: por ahora
            traducimos progresivamente las pantallas principales.)
          </p>
          <div className="mt-2 flex gap-2">
            {(
              [
                { valor: "es", etiqueta: "Español" },
                { valor: "en", etiqueta: "English" },
              ] as const
            ).map(({ valor, etiqueta }) => (
              <label
                key={valor}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm",
                  idioma === valor
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <input
                  type="radio"
                  name="idioma"
                  value={valor}
                  checked={idioma === valor}
                  onChange={() => setIdioma(valor)}
                  className="sr-only"
                />
                {etiqueta}
              </label>
            ))}
          </div>
        </div>

        {state && "error" in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state && "ok" in state && (
          <p className="text-sm text-emerald-600">Ajustes guardados.</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar ajustes"}
        </Button>
      </form>
    </div>
  );
}
