"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ETIQUETAS_ESTADO_COMPRADOR, type Comprador } from "@/app/asesor/compradores/constantes";

type Columna = "nombre" | "estado" | "presupuesto_min" | "presupuesto_max" | "fecha_ultimo_contacto";

export function Tabla({ compradores }: { compradores: Comprador[] }) {
  const [orden, setOrden] = useState<{ columna: Columna; asc: boolean }>({
    columna: "nombre",
    asc: true,
  });

  const ordenados = useMemo(() => {
    const copia = [...compradores];
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
  }, [compradores, orden]);

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
            {encabezado("nombre", "Nombre")}
            <th className="px-4 py-2 text-left font-medium">Teléfono</th>
            {encabezado("estado", "Estado")}
            {encabezado("presupuesto_min", "Presupuesto mín.")}
            {encabezado("presupuesto_max", "Presupuesto máx.")}
            {encabezado("fecha_ultimo_contacto", "Último contacto")}
          </tr>
        </thead>
        <tbody>
          {ordenados.map((c) => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-accent/50">
              <td className="px-4 py-2">
                <Link href={`/asesor/compradores/${c.id}`} className="font-medium underline">
                  {c.nombre}
                </Link>
              </td>
              <td className="px-4 py-2">{c.telefono}</td>
              <td className="px-4 py-2">{ETIQUETAS_ESTADO_COMPRADOR[c.estado] ?? c.estado}</td>
              <td className="px-4 py-2">
                {c.presupuesto_min ? `${Number(c.presupuesto_min).toLocaleString("es-ES")} €` : "—"}
              </td>
              <td className="px-4 py-2">
                {c.presupuesto_max ? `${Number(c.presupuesto_max).toLocaleString("es-ES")} €` : "—"}
              </td>
              <td className="px-4 py-2">
                {c.fecha_ultimo_contacto
                  ? new Date(c.fecha_ultimo_contacto).toLocaleDateString("es-ES")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
