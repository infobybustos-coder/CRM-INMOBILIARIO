"use client";

import Link from "next/link";
import { useTransition } from "react";
import { alternarActivoPlantilla } from "@/app/superadmin/correos/actions";
import { cn } from "@/lib/utils";
import type { PlantillaEmail } from "@/lib/correos/tipos";

export function ListaPlantillas({ plantillas }: { plantillas: PlantillaEmail[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="divide-y rounded-lg border">
      {plantillas.map((p) => (
        <div key={p.clave} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <Link href={`/superadmin/correos/${p.clave}`} className="font-medium text-primary hover:underline">
              {p.nombre}
            </Link>
            {p.descripcion && <p className="text-xs text-muted-foreground">{p.descripcion}</p>}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => alternarActivoPlantilla(p.clave, !p.activo))}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50",
              p.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
            )}
          >
            {p.activo ? "Activa" : "Inactiva"}
          </button>
        </div>
      ))}
    </div>
  );
}
