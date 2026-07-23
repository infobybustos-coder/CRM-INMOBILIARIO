"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Tema = "claro" | "oscuro";

function aplicarTema(tema: Tema) {
  document.documentElement.querySelector(".tema-asesor")?.setAttribute("data-tema", tema);
}

export function AjustesForm() {
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

      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Moneda e idioma</h2>
        <p className="text-xs text-muted-foreground">
          Por ahora el CRM funciona en euros (€) y en español. Más monedas e idiomas, próximamente.
        </p>
      </div>
    </div>
  );
}
