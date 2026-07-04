"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { temaInicial, guardarTema, type Tema } from "@/lib/tema";
import { cn } from "@/lib/utils";

const CLAVE_NAV_COLAPSADO = "nav-colapsado-inmobiliaria";

function navColapsadoInicial() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLAVE_NAV_COLAPSADO) === "true";
}

export function PreferenciasForm() {
  const [tema, setTema] = useState<Tema>(temaInicial);
  const [navColapsado, setNavColapsado] = useState(navColapsadoInicial);

  function elegirTema(nuevo: Tema) {
    setTema(nuevo);
    guardarTema(nuevo);
  }

  function alternarNavColapsado(valor: boolean) {
    setNavColapsado(valor);
    localStorage.setItem(CLAVE_NAV_COLAPSADO, String(valor));
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Tema</p>
        <div className="flex rounded-md border p-1">
          <button
            type="button"
            onClick={() => elegirTema("claro")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm",
              tema === "claro" && "bg-accent"
            )}
          >
            <Sun className="size-4" /> Claro
          </button>
          <button
            type="button"
            onClick={() => elegirTema("oscuro")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm",
              tema === "oscuro" && "bg-accent"
            )}
          >
            <Moon className="size-4" /> Oscuro
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={navColapsado}
          onChange={(e) => alternarNavColapsado(e.target.checked)}
          className="size-4 rounded border"
        />
        Menú lateral contraído por defecto
      </label>
      <p className="text-xs text-muted-foreground">
        Se aplicará la próxima vez que cargues el panel.
      </p>
    </div>
  );
}
