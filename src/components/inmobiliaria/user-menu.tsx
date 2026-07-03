"use client";

import { useEffect, useRef, useState } from "react";
import { User, LogOut } from "lucide-react";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({
  nombre,
  rolLabel,
  cerrarSesionAction,
}: {
  nombre: string;
  rolLabel: string;
  cerrarSesionAction: () => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Menú de cuenta"
        className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground"
      >
        {iniciales(nombre) || <User className="size-4" />}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border bg-card shadow-lg">
          <div className="border-b px-3 py-2">
            <p className="truncate text-sm font-medium">{nombre}</p>
            <p className="truncate text-xs text-muted-foreground">{rolLabel}</p>
          </div>
          <form action={cerrarSesionAction} className="p-1">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
