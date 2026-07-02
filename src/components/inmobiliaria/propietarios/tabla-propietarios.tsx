"use client";

import Link from "next/link";
import { calcularPrioridad, calcularCaptacionScore, diasDesde } from "@/lib/prioridad";
import { ETIQUETAS_ESTADO, ETIQUETAS_TIPO_INMUEBLE } from "@/app/asesor/propietarios/constantes";
import { cn } from "@/lib/utils";

type Propietario = {
  id: string;
  nombre: string;
  direccion: string | null;
  estado: string;
  valor_estimado: number | null;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  fuente_lead: string | null;
  agente_id: string | null;
  guion_captacion: unknown;
  notas: string | null;
};

const PRIORIDAD_LABEL: Record<string, string> = { alta: "Alta", media: "Media", baja: "Baja" };
const PRIORIDAD_COLOR: Record<string, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  baja: "bg-muted text-muted-foreground",
};
const ESTADO_COLOR: Record<string, string> = {
  nuevo_lead: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  contactado: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  tasacion_programada: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  tasacion_realizada: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  negociacion: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  exclusiva_firmada: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  captado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  perdido: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};
const FUENTE_LABEL: Record<string, string> = {
  portal: "Portal",
  referido: "Referido",
  redes_sociales: "RRSS",
  buzon: "Buzón",
  web: "Web",
  llamada_fria: "Llamada",
  otro: "Otro",
};

function fmtContacto(fecha: string | null): string {
  const dias = diasDesde(fecha);
  if (dias === null) return "—";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias}d`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)}sem`;
  return `Hace ${Math.floor(dias / 30)}m`;
}

function fmtProxima(fecha: string | null): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - hoy.getTime()) / 86400000);
  if (diff < 0) return `Hace ${Math.abs(diff)}d ⚠`;
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function fmtEuro(n: number | null): string {
  if (!n) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function TablaPropietarios({
  propietarios,
  agentes,
  basePath = "/inmobiliaria/propietarios",
}: {
  propietarios: Propietario[];
  agentes: Record<string, string>;
  basePath?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 text-left">Prioridad · Score</th>
            <th className="px-4 py-3 text-left">Propietario · Dirección</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-left">Asesor</th>
            <th className="px-4 py-3 text-left">Próxima acción</th>
            <th className="px-4 py-3 text-left">Último contacto</th>
            <th className="px-4 py-3 text-left hidden lg:table-cell">Fuente</th>
            <th className="px-4 py-3 text-right hidden lg:table-cell">Valor est.</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {propietarios.map((p) => {
            const prioridad = calcularPrioridad(p);
            const score = calcularCaptacionScore(p);
            const proxVencida = p.fecha_proxima_accion && new Date(p.fecha_proxima_accion) < new Date();

            return (
              <tr key={p.id} className="group hover:bg-muted/30 transition-colors">
                {/* Prioridad + Score */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {prioridad ? (
                      <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold w-fit", PRIORIDAD_COLOR[prioridad])}>
                        {PRIORIDAD_LABEL[prioridad]}
                      </span>
                    ) : <span className="text-xs text-muted-foreground/50">—</span>}
                    <span className="text-xs font-bold text-primary">{score}</span>
                  </div>
                </td>

                {/* Nombre + dirección */}
                <td className="px-4 py-3">
                  <Link href={`${basePath}/${p.id}`} className="font-medium hover:text-primary hover:underline">
                    {p.nombre}
                  </Link>
                  {p.direccion && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{p.direccion}</p>
                  )}
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", ESTADO_COLOR[p.estado] ?? "bg-muted text-muted-foreground")}>
                    {ETIQUETAS_ESTADO[p.estado] ?? p.estado}
                  </span>
                </td>

                {/* Asesor */}
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.agente_id ? (agentes[p.agente_id] ?? "—").split(" ")[0] : "—"}
                </td>

                {/* Próxima acción */}
                <td className="px-4 py-3">
                  <span className={cn("text-sm", proxVencida ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                    {fmtProxima(p.fecha_proxima_accion)}
                  </span>
                </td>

                {/* Último contacto */}
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {fmtContacto(p.fecha_ultimo_contacto)}
                </td>

                {/* Fuente (oculto en móvil) */}
                <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                  {p.fuente_lead ? (FUENTE_LABEL[p.fuente_lead] ?? p.fuente_lead) : "—"}
                </td>

                {/* Valor estimado (oculto en móvil) */}
                <td className="px-4 py-3 text-right text-sm font-medium hidden lg:table-cell">
                  {fmtEuro(p.valor_estimado)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
