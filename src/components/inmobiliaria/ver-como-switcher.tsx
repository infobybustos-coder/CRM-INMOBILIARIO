"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { valor: "administrador", etiqueta: "Admin" },
  { valor: "director_comercial", etiqueta: "Director" },
  { valor: "agente", etiqueta: "Agente" },
  { valor: "captador", etiqueta: "Captador" },
] as const;

export function VerComoSwitcher({ rolActual }: { rolActual: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const verComo = searchParams.get("ver_como") ?? rolActual;

  function cambiar(rol: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (rol === rolActual) {
      params.delete("ver_como");
    } else {
      params.set("ver_como", rol);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Eye className="size-3.5" />
        Ver como
      </span>
      <div className="flex rounded-lg border bg-muted p-0.5">
        {ROLES.map((r) => (
          <button
            key={r.valor}
            type="button"
            onClick={() => cambiar(r.valor)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              verComo === r.valor
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r.etiqueta}
          </button>
        ))}
      </div>
      {verComo !== rolActual && (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
          Vista previa
        </span>
      )}
    </div>
  );
}
