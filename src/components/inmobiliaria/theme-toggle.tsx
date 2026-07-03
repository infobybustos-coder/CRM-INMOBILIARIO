"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "claro" | "oscuro";

function aplicarTema(tema: Tema) {
  document.documentElement
    .querySelector(".tema-inmobiliaria")
    ?.setAttribute("data-tema", tema);
}

function temaInicial(): Tema {
  if (typeof window === "undefined") return "claro";
  const guardado = localStorage.getItem("tema-inmobiliaria") as Tema | null;
  if (guardado === "claro" || guardado === "oscuro") {
    aplicarTema(guardado);
    return guardado;
  }
  return "claro";
}

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  function alternar() {
    const nuevo: Tema = tema === "claro" ? "oscuro" : "claro";
    setTema(nuevo);
    localStorage.setItem("tema-inmobiliaria", nuevo);
    aplicarTema(nuevo);
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
