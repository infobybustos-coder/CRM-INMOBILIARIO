"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const PERIODOS = [
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "semana", etiqueta: "Semana" },
  { valor: "mes", etiqueta: "Mes" },
] as const;

export function PeriodoSwitcher({ periodo }: { periodo: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function cambiarPeriodo(nuevo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", nuevo);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex rounded-md border p-1">
      {PERIODOS.map((p) => (
        <button
          key={p.valor}
          type="button"
          onClick={() => cambiarPeriodo(p.valor)}
          className={cn(
            "rounded px-3 py-1 text-sm",
            periodo === p.valor && "bg-accent"
          )}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>
  );
}
