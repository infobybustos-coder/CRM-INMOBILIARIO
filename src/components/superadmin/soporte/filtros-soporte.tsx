"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ESTADOS_CONVERSACION } from "@/lib/soporte/tipos";

export function FiltrosSoporte() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function actualizar(clave: string, valor: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(clave, valor);
    else params.delete(clave);
    router.push(`${pathname}?${params.toString()}`);
  }

  const q = searchParams.get("q") ?? "";
  const estado = searchParams.get("estado") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        defaultValue={q}
        onChange={(e) => actualizar("q", e.target.value || null)}
        placeholder="Buscar por cliente, email o asunto..."
        className="w-64 rounded-md border bg-background px-3 py-1.5 text-sm"
      />
      <span className="mx-1 h-4 w-px bg-border" />
      {ESTADOS_CONVERSACION.map((e) => (
        <button
          key={e.valor}
          type="button"
          onClick={() => actualizar("estado", estado === e.valor ? null : e.valor)}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            estado === e.valor ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
          )}
        >
          {e.etiqueta}
        </button>
      ))}
    </div>
  );
}
