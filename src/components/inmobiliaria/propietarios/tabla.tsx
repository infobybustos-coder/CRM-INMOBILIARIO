"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_FUENTE_LEAD,
  type Propietario,
} from "@/app/asesor/propietarios/constantes";
import { calcularPrioridad, calcularCaptacionScore } from "@/lib/prioridad";
import { useMoneda } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

type PropietarioConAgente = Propietario & { agente_id: string | null };

type Columna =
  | "score"
  | "nombre"
  | "direccion"
  | "estado"
  | "agente"
  | "fecha_proxima_accion"
  | "fecha_ultimo_contacto"
  | "fuente_lead"
  | "valor_estimado";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

export function Tabla({
  propietarios,
  agentesPorId,
  basePath = "/inmobiliaria/propietarios",
}: {
  propietarios: PropietarioConAgente[];
  agentesPorId: Map<string, string>;
  basePath?: string;
}) {
  const { formatear } = useMoneda();
  const [orden, setOrden] = useState<{ columna: Columna; asc: boolean }>({
    columna: "nombre",
    asc: true,
  });

  const valorColumna = (p: PropietarioConAgente, columna: Columna) => {
    switch (columna) {
      case "score":
        return calcularCaptacionScore(p);
      case "agente":
        return agentesPorId.get(p.agente_id ?? "") ?? "";
      default:
        return p[columna as keyof Propietario];
    }
  };

  const ordenados = useMemo(() => {
    const copia = [...propietarios];
    copia.sort((a, b) => {
      const va = valorColumna(a, orden.columna);
      const vb = valorColumna(b, orden.columna);
      if (va == null || va === "") return 1;
      if (vb == null || vb === "") return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return orden.asc ? va - vb : vb - va;
      }
      return orden.asc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return copia;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propietarios, orden, agentesPorId]);

  function cambiarOrden(columna: Columna) {
    setOrden((prev) =>
      prev.columna === columna ? { columna, asc: !prev.asc } : { columna, asc: true }
    );
  }

  function encabezado(columna: Columna, etiqueta: string, claseExtra?: string) {
    return (
      <th
        className={cn("cursor-pointer px-4 py-2 text-left font-medium", claseExtra)}
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
            <th className="px-4 py-2 text-left font-medium">Prioridad</th>
            {encabezado("score", "Score")}
            {encabezado("nombre", "Propietario")}
            {encabezado("direccion", "Dirección")}
            {encabezado("estado", "Estado")}
            {encabezado("agente", "Asesor")}
            {encabezado("fecha_proxima_accion", "Próxima acción")}
            {encabezado("fecha_ultimo_contacto", "Último contacto")}
            {encabezado("fuente_lead", "Fuente", "hidden md:table-cell")}
            {encabezado("valor_estimado", "Valor estimado", "hidden md:table-cell")}
          </tr>
        </thead>
        <tbody>
          {ordenados.map((p) => {
            const prioridad = calcularPrioridad(p);
            const vencida = p.fecha_proxima_accion ? new Date(p.fecha_proxima_accion) < new Date() : false;
            return (
              <tr key={p.id} className="border-b last:border-0 hover:bg-accent/50">
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
                <td className="px-4 py-2">{calcularCaptacionScore(p)}</td>
                <td className="px-4 py-2">
                  <Link href={`${basePath}/${p.id}`} className="font-medium underline">
                    {p.nombre}
                  </Link>
                </td>
                <td className="max-w-48 truncate px-4 py-2 text-muted-foreground">
                  {p.direccion ?? "—"}
                </td>
                <td className="px-4 py-2">{ETIQUETAS_ESTADO[p.estado] ?? p.estado}</td>
                <td className="px-4 py-2">{agentesPorId.get(p.agente_id ?? "") ?? "Sin asignar"}</td>
                <td className={cn("px-4 py-2", vencida && "font-medium text-red-500")}>
                  {p.fecha_proxima_accion
                    ? new Date(p.fecha_proxima_accion).toLocaleDateString("es-ES")
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {p.fecha_ultimo_contacto
                    ? new Date(p.fecha_ultimo_contacto).toLocaleDateString("es-ES")
                    : "—"}
                </td>
                <td className="hidden px-4 py-2 md:table-cell">
                  {p.fuente_lead ? ETIQUETAS_FUENTE_LEAD[p.fuente_lead] ?? p.fuente_lead : "—"}
                </td>
                <td className="hidden px-4 py-2 md:table-cell">{formatear(p.valor_estimado)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
