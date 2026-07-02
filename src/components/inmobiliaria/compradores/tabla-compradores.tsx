"use client";

import Link from "next/link";
import { calcularPrioridadComprador, calcularCompraScore, diasDesde } from "@/lib/prioridad";
import { ETIQUETAS_ESTADO_COMPRADOR } from "@/app/inmobiliaria/constantes";
import { cn } from "@/lib/utils";

type Comprador = {
  id: string;
  nombre: string;
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  tipo_inmueble: string | null;
  zona_buscada_id: string | null;
  habitaciones: number | null;
  urgencia: string | null;
  estado: string;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  agente_id: string | null;
};

const PRIORIDAD_COLOR: Record<string, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  baja: "bg-muted text-muted-foreground",
};
const ESTADO_COLOR: Record<string, string> = {
  nuevo: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  cualificado: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  busqueda_activa: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  visitas: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  oferta: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  reserva: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  comprado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  perdido: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
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

function fmtProxima(fecha: string | null): { texto: string; vencida: boolean } {
  if (!fecha) return { texto: "—", vencida: false };
  const d = new Date(fecha);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - hoy.getTime()) / 86400000);
  if (diff < 0) return { texto: `⚠ Hace ${Math.abs(diff)}d`, vencida: true };
  if (diff === 0) return { texto: "Hoy", vencida: false };
  if (diff === 1) return { texto: "Mañana", vencida: false };
  return {
    texto: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    vencida: false,
  };
}

function fmtPresupuesto(min: number | null, max: number | null): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  if (!min && !max) return "—";
  if (!min) return `Hasta ${fmt(max!)}`;
  if (!max) return `Desde ${fmt(min)}`;
  return `${fmt(min)} – ${fmt(max)}`;
}

export function TablaCompradores({
  compradores,
  agentes,
  zonas,
  basePath = "/inmobiliaria/compradores",
}: {
  compradores: Comprador[];
  agentes: Record<string, string>;
  zonas: Record<string, string>;
  basePath?: string;
}) {
  if (compradores.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        Sin compradores
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 text-left">⭐ Prio · 🎯 Score</th>
            <th className="px-4 py-3 text-left">👤 Comprador</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">📍 Zona buscada</th>
            <th className="px-4 py-3 text-left">💰 Presupuesto</th>
            <th className="px-4 py-3 text-center hidden lg:table-cell">🛏 Hab.</th>
            <th className="px-4 py-3 text-left">📊 Estado</th>
            <th className="px-4 py-3 text-left hidden sm:table-cell">👨‍💼 Asesor</th>
            <th className="px-4 py-3 text-left hidden lg:table-cell">📅 Próxima acción</th>
            <th className="px-4 py-3 text-left hidden lg:table-cell">⏱ Último contacto</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {compradores.map((c) => {
            const prioridad = calcularPrioridadComprador(c);
            const score = calcularCompraScore(c);
            const { texto: proxText, vencida } = fmtProxima(c.fecha_proxima_accion);

            return (
              <tr key={c.id} className="group hover:bg-muted/30 transition-colors">
                {/* Prioridad + Score */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {prioridad ? (
                      <span
                        className={cn(
                          "w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                          PRIORIDAD_COLOR[prioridad]
                        )}
                      >
                        {prioridad}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                    <span className="text-xs font-bold text-primary">{score}</span>
                  </div>
                </td>

                {/* Nombre + tipo */}
                <td className="px-4 py-3">
                  <Link
                    href={`${basePath}/${c.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {c.nombre}
                  </Link>
                  {c.tipo_inmueble && (
                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                      🏠 {c.tipo_inmueble.replace(/_/g, " ")}
                    </p>
                  )}
                </td>

                {/* Zona */}
                <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                  {c.zona_buscada_id ? (zonas[c.zona_buscada_id] ?? "—") : "—"}
                </td>

                {/* Presupuesto */}
                <td className="px-4 py-3 text-sm font-medium">
                  {fmtPresupuesto(c.presupuesto_min, c.presupuesto_max)}
                </td>

                {/* Habitaciones */}
                <td className="px-4 py-3 text-center text-sm text-muted-foreground hidden lg:table-cell">
                  {c.habitaciones ? `${c.habitaciones}+` : "—"}
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                      ESTADO_COLOR[c.estado] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {ETIQUETAS_ESTADO_COMPRADOR[c.estado] ?? c.estado}
                  </span>
                </td>

                {/* Asesor */}
                <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                  {c.agente_id ? (agentes[c.agente_id] ?? "—").split(" ")[0] : "—"}
                </td>

                {/* Próxima */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span
                    className={cn(
                      "text-sm",
                      vencida
                        ? "font-semibold text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {proxText}
                  </span>
                </td>

                {/* Último contacto */}
                <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                  {fmtContacto(c.fecha_ultimo_contacto)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
