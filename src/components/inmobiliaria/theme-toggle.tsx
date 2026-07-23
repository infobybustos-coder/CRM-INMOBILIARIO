"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { temaInicial, guardarTema, type Tema } from "@/lib/tema";

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  function alternar() {
    const nuevo: Tema = tema === "claro" ? "oscuro" : "claro";
    setTema(nuevo);
    guardarTema(nuevo);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Cambiar tema claro/oscuro"
      className="flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    >
      {tema === "claro" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
