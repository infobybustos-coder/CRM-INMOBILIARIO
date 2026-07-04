"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";

function hoyISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function FiltroDia({ dia }: { dia: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const todos = dia === "todos";

  function setDia(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dia", valor);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md border px-2 py-1">
        <CalendarDays className="size-3.5 text-muted-foreground" />
        <input
          type="date"
          value={todos ? "" : dia}
          onChange={(e) => e.target.value && setDia(e.target.value)}
          className="bg-transparent text-sm outline-none"
        />
      </div>
      <button
        type="button"
        onClick={() => setDia(hoyISO())}
        className={cn(
          "rounded-md border px-2 py-1 text-xs",
          !todos && dia === hoyISO() ? "bg-accent" : "text-muted-foreground hover:bg-accent"
        )}
      >
        Hoy
      </button>
      <button
        type="button"
        onClick={() => setDia("todos")}
        className={cn(
          "flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
          todos ? "bg-accent" : "text-muted-foreground hover:bg-accent"
        )}
      >
        {todos ? <X className="size-3" /> : null} Ver todos
      </button>
    </div>
  );
}
