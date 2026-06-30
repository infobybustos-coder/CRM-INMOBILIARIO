"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, Headset, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

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
  avatarUrl,
  cerrarSesionAction,
}: {
  nombre: string;
  avatarUrl: string | null;
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
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          iniciales(nombre) || <User className="size-4" />
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border bg-card shadow-lg">
          <div className="border-b px-3 py-2">
            <p className="truncate text-sm font-medium">{nombre}</p>
          </div>
          <nav className="flex flex-col p-1 text-sm">
            <Link
              href="/asesor/perfil"
              onClick={() => setAbierto(false)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <User className="size-4" />
              Mi perfil
            </Link>
            <Link
              href="/asesor/soporte"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground"
            >
              <Headset className="size-4" />
              Soporte técnico
            </Link>
            <Link
              href="/asesor/ajustes"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="size-4" />
              Ajustes
            </Link>
          </nav>
          <form action={cerrarSesionAction} className="border-t p-1">
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
