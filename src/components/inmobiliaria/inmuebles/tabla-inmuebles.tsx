"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ETIQUETAS_ESTADO_INMUEBLE, ETIQUETAS_TIPO_INMUEBLE } from "@/app/inmobiliaria/constantes";

type Inmueble = {
  id: string;
  referencia: string | null;
  foto: string | null;
  visitas: number;
  poblacion: string | null;
  direccion: string;
  tipo: string | null;
  precio: number | null;
  metros_cuadrados: number | null;
  estado: string;
  agente_id: string | null;
};

const ESTADO_COLOR: Record<string, string> = {
  captacion: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  preparacion: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  publicado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  visitas: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  oferta: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  reservado: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  vendido: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

function fmtEuro(n: number | null): string {
  if (!n) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function TablaInmuebles({
  inmuebles,
  agentes,
  basePath = "/inmobiliaria/inmuebles",
}: {
  inmuebles: Inmueble[];
  agentes: Record<string, string>;
  basePath?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 text-left">Foto · Ref</th>
            <th className="px-4 py-3 text-left">Dirección · Población</th>
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-right">Precio</th>
            <th className="px-4 py-3 text-right hidden md:table-cell">m²</th>
            <th className="px-4 py-3 text-center hidden md:table-cell">Visitas</th>
            <th className="px-4 py-3 text-left">Asesor</th>
            <th className="px-4 py-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {inmuebles.map((i) => (
            <tr key={i.id} className="hover:bg-muted/30 transition-colors">
              {/* Foto + referencia */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="size-10 shrink-0 rounded-md bg-muted overflow-hidden">
                    {i.foto ? (
                      <img src={i.foto} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground/30 text-lg">🏠</div>
                    )}
                  </div>
                  {i.referencia && (
                    <span className="text-[11px] text-muted-foreground font-mono">{i.referencia}</span>
                  )}
                </div>
              </td>

              {/* Dirección */}
              <td className="px-4 py-3">
                <Link href={`${basePath}/${i.id}`} className="font-medium hover:text-primary hover:underline line-clamp-1">
                  {i.direccion}
                </Link>
                {i.poblacion && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{i.poblacion}</p>
                )}
              </td>

              {/* Tipo */}
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {i.tipo ? (ETIQUETAS_TIPO_INMUEBLE[i.tipo] ?? i.tipo) : "—"}
              </td>

              {/* Precio */}
              <td className="px-4 py-3 text-right font-semibold">
                {fmtEuro(i.precio)}
              </td>

              {/* m² */}
              <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                {i.metros_cuadrados ? `${i.metros_cuadrados} m²` : "—"}
              </td>

              {/* Visitas */}
              <td className="px-4 py-3 text-center hidden md:table-cell">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                  {i.visitas}
                </span>
              </td>

              {/* Asesor */}
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {i.agente_id ? (agentes[i.agente_id] ?? "—").split(" ")[0] : "—"}
              </td>

              {/* Estado */}
              <td className="px-4 py-3">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", ESTADO_COLOR[i.estado] ?? "bg-muted text-muted-foreground")}>
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
