"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, List } from "lucide-react";
import { cn } from "@/lib/utils";

export function VistaSwitcher({ vista }: { vista: "calendario" | "lista" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function cambiarVista(nueva: "calendario" | "lista") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("vista", nueva);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex rounded-md border p-1">
      <button
        type="button"
        onClick={() => cambiarVista("calendario")}
        className={cn(
          "flex items-center gap-1 rounded px-3 py-1 text-sm",
          vista === "calendario" && "bg-accent"
        )}
      >
        <Calendar className="size-4" />
        Calendario
      </button>
      <button
        type="button"
        onClick={() => cambiarVista("lista")}
        className={cn(
          "flex items-center gap-1 rounded px-3 py-1 text-sm",
          vista === "lista" && "bg-accent"
        )}
      >
        <List className="size-4" />
        Lista
      </button>
    </div>
  );
}
