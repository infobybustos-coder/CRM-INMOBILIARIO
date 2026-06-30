"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ETIQUETAS_ESTADO, type Propietario } from "@/app/asesor/propietarios/constantes";
import { calcularPrioridad, calcularCaptacionScore } from "@/lib/prioridad";
import { useMoneda } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

type Columna = "nombre" | "estado" | "fecha_ultimo_contacto" | "valor_estimado" | "score";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

export function Tabla({ propietarios }: { propietarios: Propietario[] }) {
  const { formatear } = useMoneda();
  const [orden, setOrden] = useState<{ columna: Columna; asc: boolean }>({
    columna: "nombre",
    asc: true,
  });

  const ordenados = useMemo(() => {
    const copia = [...propietarios];
    copia.sort((a, b) => {
      const va = orden.columna === "score" ? calcularCaptacionScore(a) : a[orden.columna];
      const vb = orden.columna === "score" ? calcularCaptacionScore(b) : b[orden.columna];
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
  }, [propietarios, orden]);

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
            {encabezado("fecha_ultimo_contacto", "Último contacto")}
            {encabezado("valor_estimado", "Valor estimado")}
            {encabezado("score", "Score")}
            <th className="px-4 py-2 text-left font-medium">Prioridad</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((p) => {
            const prioridad = calcularPrioridad(p);
            return (
              <tr key={p.id} className="border-b last:border-0 hover:bg-accent/50">
                <td className="px-4 py-2">
                  <Link href={`/asesor/propietarios/${p.id}`} className="font-medium underline">
                    {p.nombre}
                  </Link>
                </td>
                <td className="px-4 py-2">{p.telefono}</td>
                <td className="px-4 py-2">{ETIQUETAS_ESTADO[p.estado] ?? p.estado}</td>
                <td className="px-4 py-2">
                  {p.fecha_ultimo_contacto
                    ? new Date(p.fecha_ultimo_contacto).toLocaleDateString("es-ES")
                    : "—"}
                </td>
                <td className="px-4 py-2">{formatear(p.valor_estimado)}</td>
                <td className="px-4 py-2">{calcularCaptacionScore(p)}</td>
                <td className="px-4 py-2">
                  {prioridad && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                        COLOR_PRIORIDAD[prioridad]
                      )}
                    >
                      {prioridad}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
