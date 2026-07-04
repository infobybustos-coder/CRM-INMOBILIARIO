"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ETIQUETAS_ESTADO_COMPRADOR, type Comprador } from "@/app/asesor/compradores/constantes";
import { calcularPrioridadComprador, calcularCompraScore } from "@/lib/prioridad";
import { useMoneda } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

type CompradorConAgente = Comprador & { agente_id: string | null };

type Columna =
  | "score"
  | "nombre"
  | "zona"
  | "presupuesto_max"
  | "habitaciones"
  | "estado"
  | "agente"
  | "fecha_proxima_accion"
  | "fecha_ultimo_contacto";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

export function Tabla({
  compradores,
  agentesPorId,
  zonasPorId,
  basePath = "/inmobiliaria/compradores",
}: {
  compradores: CompradorConAgente[];
  agentesPorId: Map<string, string>;
  zonasPorId: Map<string, string>;
  basePath?: string;
}) {
  const { formatear } = useMoneda();
  const [orden, setOrden] = useState<{ columna: Columna; asc: boolean }>({
    columna: "nombre",
    asc: true,
  });

  const valorColumna = (c: CompradorConAgente, columna: Columna) => {
    switch (columna) {
      case "score":
        return calcularCompraScore(c);
      case "agente":
        return agentesPorId.get(c.agente_id ?? "") ?? "";
      case "zona":
        return zonasPorId.get(c.zona_buscada_id ?? "") ?? "";
      default:
        return c[columna as keyof Comprador];
    }
  };

  const ordenados = useMemo(() => {
    const copia = [...compradores];
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
  }, [compradores, orden, agentesPorId, zonasPorId]);

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
            <th className="px-4 py-2 text-left font-medium">Prioridad</th>
            {encabezado("score", "Score")}
            {encabezado("nombre", "Comprador")}
            {encabezado("zona", "Zona buscada")}
            {encabezado("presupuesto_max", "Presupuesto")}
            {encabezado("habitaciones", "Habitaciones")}
            {encabezado("estado", "Estado")}
            {encabezado("agente", "Asesor")}
            {encabezado("fecha_proxima_accion", "Próxima acción")}
            {encabezado("fecha_ultimo_contacto", "Último contacto")}
          </tr>
        </thead>
        <tbody>
          {ordenados.map((c) => {
            const prioridad = calcularPrioridadComprador(c);
            const vencida = c.fecha_proxima_accion ? new Date(c.fecha_proxima_accion) < new Date() : false;
            const presupuesto =
              c.presupuesto_min && c.presupuesto_max
                ? `${formatear(c.presupuesto_min)} - ${formatear(c.presupuesto_max)}`
                : c.presupuesto_max
                  ? `Hasta ${formatear(c.presupuesto_max)}`
                  : c.presupuesto_min
                    ? `Desde ${formatear(c.presupuesto_min)}`
                    : "—";
            return (
              <tr key={c.id} className="border-b last:border-0 hover:bg-accent/50">
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
                <td className="px-4 py-2">{calcularCompraScore(c)}</td>
                <td className="px-4 py-2">
                  <Link href={`${basePath}/${c.id}`} className="font-medium underline">
                    {c.nombre}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {zonasPorId.get(c.zona_buscada_id ?? "") ?? "—"}
                </td>
                <td className="px-4 py-2">{presupuesto}</td>
                <td className="px-4 py-2">{c.habitaciones ?? "—"}</td>
                <td className="px-4 py-2">{ETIQUETAS_ESTADO_COMPRADOR[c.estado] ?? c.estado}</td>
                <td className="px-4 py-2">{agentesPorId.get(c.agente_id ?? "") ?? "Sin asignar"}</td>
                <td className={cn("px-4 py-2", vencida && "font-medium text-red-500")}>
                  {c.fecha_proxima_accion
                    ? new Date(c.fecha_proxima_accion).toLocaleDateString("es-ES")
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {c.fecha_ultimo_contacto
                    ? new Date(c.fecha_ultimo_contacto).toLocaleDateString("es-ES")
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
