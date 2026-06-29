"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ESTADOS_PROPIETARIO,
  ETIQUETAS_ESTADO,
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/app/asesor/propietarios/constantes";

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
    <div className="flex flex-wrap gap-3">
      <select
        defaultValue={searchParams.get("estado") ?? ""}
        onChange={(e) => actualizar("estado", e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todos los estados</option>
        {ESTADOS_PROPIETARIO.map((e) => (
          <option key={e} value={e}>
            {ETIQUETAS_ESTADO[e]}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("tipo_inmueble") ?? ""}
        onChange={(e) => actualizar("tipo_inmueble", e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">Todos los tipos</option>
        {TIPOS_INMUEBLE.map((t) => (
          <option key={t} value={t}>
            {ETIQUETAS_TIPO_INMUEBLE[t]}
          </option>
        ))}
      </select>
    </div>
  );
}
