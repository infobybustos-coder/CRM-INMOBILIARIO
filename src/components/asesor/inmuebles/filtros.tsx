"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ESTADOS_INMUEBLE,
  ETIQUETAS_ESTADO_INMUEBLE,
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/app/asesor/inmuebles/constantes";

export function Filtros() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function actualizar(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(clave, valor);
    else params.delete(clave);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        defaultValue={searchParams.get("estado") ?? ""}
        onChange={(e) => actualizar("estado", e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todos los estados</option>
        {ESTADOS_INMUEBLE.map((e) => (
          <option key={e} value={e}>
            {ETIQUETAS_ESTADO_INMUEBLE[e]}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("tipo") ?? ""}
        onChange={(e) => actualizar("tipo", e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todos los tipos</option>
        {TIPOS_INMUEBLE.map((t) => (
          <option key={t} value={t}>
            {ETIQUETAS_TIPO_INMUEBLE[t]}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Precio mín."
        defaultValue={searchParams.get("precio_min") ?? ""}
        onBlur={(e) => actualizar("precio_min", e.target.value)}
        className="w-32 rounded-md border bg-background px-3 py-2 text-sm"
      />
      <input
        type="number"
        placeholder="Precio máx."
        defaultValue={searchParams.get("precio_max") ?? ""}
        onBlur={(e) => actualizar("precio_max", e.target.value)}
        className="w-32 rounded-md border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
