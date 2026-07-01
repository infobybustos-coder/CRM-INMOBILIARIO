"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ETIQUETAS_ESTADO_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  type Inmueble,
} from "@/app/asesor/inmuebles/constantes";
import { FotoMiniatura } from "@/components/asesor/inmuebles/foto-miniatura";
import { useMoneda } from "@/lib/preferencias";

const COLOR_ESTADO: Record<string, string> = {
  captacion: "bg-sky-500/15 text-sky-600",
  preparacion: "bg-amber-500/15 text-amber-600",
  publicado: "bg-cyan-500/15 text-cyan-600",
  visitas: "bg-orange-500/15 text-orange-600",
  oferta: "bg-violet-500/15 text-violet-600",
  reservado: "bg-indigo-500/15 text-indigo-600",
  vendido: "bg-emerald-500/15 text-emerald-600",
};

type Columna = "direccion" | "estado" | "precio" | "metros_cuadrados" | "visitas";

export function Tabla({
  inmuebles,
  basePath = "/asesor/inmuebles",
}: {
  inmuebles: Inmueble[];
  basePath?: string;
}) {
  const router = useRouter();
  const { formatear } = useMoneda();
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
            <th className="px-4 py-2 text-left font-medium">Foto</th>
            <th className="px-4 py-2 text-left font-medium">Ref.</th>
            {encabezado("direccion", "Dirección")}
            <th className="px-4 py-2 text-left font-medium">Familia</th>
            <th className="px-4 py-2 text-left font-medium">Población</th>
            {encabezado("precio", "Precio")}
            {encabezado("visitas", "Visitas")}
            {encabezado("metros_cuadrados", "m²")}
            {encabezado("estado", "Estado")}
          </tr>
        </thead>
        <tbody>
          {ordenados.map((i) => (
            <tr
              key={i.id}
              onClick={() => router.push(`${basePath}/${i.id}`)}
              className="cursor-pointer border-b last:border-0 hover:bg-accent/50"
            >
              <td className="px-4 py-2">
                <FotoMiniatura rutaStorage={i.foto} className="size-20" />
              </td>
              <td className="px-4 py-2 text-muted-foreground">{i.referencia ?? "—"}</td>
              <td className="px-4 py-2 font-medium">{i.direccion}</td>
              <td className="px-4 py-2">
                {i.tipo ? ETIQUETAS_TIPO_INMUEBLE[i.tipo] ?? i.tipo : "—"}
              </td>
              <td className="px-4 py-2">{i.poblacion ?? "—"}</td>
              <td className="px-4 py-2">{formatear(i.precio)}</td>
              <td className="px-4 py-2">{i.visitas}</td>
              <td className="px-4 py-2">{i.metros_cuadrados ? `${i.metros_cuadrados} m²` : "—"}</td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_ESTADO[i.estado] ?? "bg-muted text-muted-foreground"}`}
                >
                  {ETIQUETAS_ESTADO_INMUEBLE[i.estado] ?? i.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
