"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export function VistaSwitcher({ vista }: { vista: "kanban" | "tabla" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function cambiarVista(nueva: "kanban" | "tabla") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("vista", nueva);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex rounded-md border p-1">
      <button
        type="button"
        onClick={() => cambiarVista("kanban")}
        className={cn("flex items-center gap-1 rounded px-3 py-1 text-sm", vista === "kanban" && "bg-accent")}
      >
        <LayoutGrid className="size-4" />
        Kanban
      </button>
      <button
        type="button"
        onClick={() => cambiarVista("tabla")}
        className={cn("flex items-center gap-1 rounded px-3 py-1 text-sm", vista === "tabla" && "bg-accent")}
      >
        <List className="size-4" />
        Tabla
      </button>
    </div>
  );
}
