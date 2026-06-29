"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ETIQUETAS_ESTADO_INMUEBLE, type Inmueble } from "@/app/asesor/inmuebles/constantes";

type Columna = "direccion" | "estado" | "precio" | "metros_cuadrados";

export function Tabla({ inmuebles }: { inmuebles: Inmueble[] }) {
  const [orden, setOrden] = useState<{ columna: Columna; asc: boolean }>({
    columna: "direccion",
    asc: true,
  });

  const ordenados = useMemo(() => {
    const copia = [...inmuebles];
    copia.sort((a, b) => {
      const va = a[orden.columna];
      const vb = b[orden.columna];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return orden.asc ? va - vb : vb - va;
      }
      return orden.asc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return copia;
  }, [inmuebles, orden]);

  function cambiarOrden(columna: Columna) {
    setOrden((prev) =>
      prev.columna === columna ? { columna, asc: !prev.asc } : { columna, asc: true }
    );
  }

  function encabezado(columna: Columna, etiqueta: string) {
    return (
      <th
        className="cursor-pointer px-4 py-2 text-left font-medium"
        onClick={() => cambiarOrden(columna)}
      >
        {etiqueta} {orden.columna === columna && (orden.asc ? "↑" : "↓")}
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-max text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            {encabezado("direccion", "Dirección")}
            {encabezado("estado", "Estado")}
            {encabezado("precio", "Precio")}
            {encabezado("metros_cuadrados", "m²")}
          </tr>
        </thead>
        <tbody>
          {ordenados.map((i) => (
            <tr key={i.id} className="border-b last:border-0 hover:bg-accent/50">
              <td className="px-4 py-2">
                <Link href={`/asesor/inmuebles/${i.id}`} className="font-medium underline">
                  {i.direccion}
                </Link>
              </td>
              <td className="px-4 py-2">{ETIQUETAS_ESTADO_INMUEBLE[i.estado] ?? i.estado}</td>
              <td className="px-4 py-2">
                {i.precio ? `${Number(i.precio).toLocaleString("es-ES")} €` : "—"}
              </td>
              <td className="px-4 py-2">{i.metros_cuadrados ? `${i.metros_cuadrados} m²` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
