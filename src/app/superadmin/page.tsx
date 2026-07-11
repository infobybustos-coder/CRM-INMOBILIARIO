import Link from "next/link";
import { Users, Crown, TrendingUp, Clock, UserPlus, UserMinus, type LucideIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { precioMensualTotal } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { banderaPais, nombrePais } from "@/lib/paises";
import { cn } from "@/lib/utils";

type Rango = "7d" | "30d" | "12m";

type TenantFila = {
  id: string;
  nombre: string;
  tipo_plan: string;
  plan_tarifa: string;
  pais: string;
  creado_en: string;
};

function bucketsDeRegistros(rango: Rango, tenants: TenantFila[]) {
  if (rango === "12m") {
    const ahora = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const offset = 11 - i;
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - offset, 1);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth() - offset + 1, 1);
      const valor = tenants.filter((t) => {
        const fc = new Date(t.creado_en);
        return fc >= inicio && fc < fin;
      }).length;
      return { etiqueta: inicio.toLocaleDateString("es-ES", { month: "short" }), valor };
    });
  }

  const dias = rango === "7d" ? 7 : 30;
  return Array.from({ length: dias }, (_, i) => {
    const offset = dias - 1 - i;
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - offset);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 1);
    const valor = tenants.filter((t) => {
      const fc = new Date(t.creado_en);
      return fc >= inicio && fc < fin;
    }).length;
    return {
      etiqueta: inicio.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      valor,
    };
  });
}

const COLORES_KPI = {
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-500",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-500",
};

function Kpi({
  label,
  valor,
  nota,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  valor: string | number;
  nota?: string;
  icon: LucideIcon;
  color: keyof typeof COLORES_KPI;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-accent/50"
    >
      <div className={cn("flex size-8 items-center justify-center rounded-md", COLORES_KPI[color])}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-2xl font-semibold">{valor}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {nota && <p className="mt-0.5 text-[10px] text-muted-foreground/70">{nota}</p>}
      </div>
    </Link>
  );
}

function FiltroRango({ actual }: { actual: Rango }) {
  const opciones: { valor: Rango; etiqueta: string }[] = [
    { valor: "7d", etiqueta: "7 días" },
    { valor: "30d", etiqueta: "30 días" },
    { valor: "12m", etiqueta: "12 meses" },
  ];
  return (
    <div className="flex gap-1">
      {opciones.map((o) => (
        <Link
          key={o.valor}
          href={`/superadmin?rango=${o.valor}`}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            actual === o.valor
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          {o.etiqueta}
        </Link>
      ))}
    </div>
  );
}

function bucketsDeVisitas(porFecha: Map<string, number>) {
  return Array.from({ length: 30 }, (_, i) => {
    const offset = 29 - i;
    const dia = new Date();
    dia.setHours(0, 0, 0, 0);
    dia.setDate(dia.getDate() - offset);
    const clave = dia.toISOString().slice(0, 10);
    return {
      etiqueta: dia.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      valor: porFecha.get(clave) ?? 0,
    };
  });
}

function GraficoLinea({ buckets }: { buckets: { etiqueta: string; valor: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.valor));
  const w = 100;
  const h = 32;
  const stepX = buckets.length > 1 ? w / (buckets.length - 1) : 0;
  const puntos = buckets.map((b, i) => ({
    x: i * stepX,
    y: h - (b.valor / max) * h,
    ...b,
  }));
  const linea = puntos.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `0,${h} ${linea} ${w},${h}`;

  return (
    <div>
      <div className="relative h-40 w-full text-sky-500">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <polygon points={area} className="fill-sky-500/10" />
          <polyline
            points={linea}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
          {puntos.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="0.7" vectorEffect="non-scaling-stroke" fill="currentColor">
              <title>
                {p.etiqueta}: {p.valor} visitas
              </title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="mt-1 flex gap-1 text-[10px] text-muted-foreground">
        {buckets.map((b, i) => (
          <div key={i} className="flex-1 truncate text-center">
            {i % 5 === 0 ? b.etiqueta : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function GraficoRegistros({
  buckets,
  rango,
}: {
  buckets: { etiqueta: string; valor: number }[];
  rango: Rango;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.valor));

  return (
    <div>
      <div className="flex h-40 items-end gap-1">
        {buckets.map((b, i) => (
          <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end">
            <div
              className="w-full max-w-6 rounded-t-sm bg-indigo-500 transition-colors group-hover:bg-indigo-400"
              style={{ height: `${(b.valor / max) * 100}%`, minHeight: b.valor > 0 ? "2px" : "0" }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 transition-opacity group-hover:opacity-100">
              {b.etiqueta}: {b.valor}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-[10px] text-muted-foreground">
        {buckets.map((b, i) => (
          <div key={i} className="flex-1 truncate text-center">
            {rango !== "30d" || i % 5 === 0 ? b.etiqueta : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SuperadminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const rango: Rango = params.rango === "7d" || params.rango === "12m" ? params.rango : "30d";

  const admin = createAdminClient();
  const config = await obtenerConfigPlanes();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    { count: clientesActivos },
    { count: inmobiliarias },
    { count: asesores },
    { count: nuevosMes },
    { data: tenantsPago },
    { count: cancelados },
    { count: pedidosPendientes },
    { data: todosTenants },
    { data: visitasData },
  ] = await Promise.all([
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("estado", "activo"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("tipo_plan", "inmobiliaria"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("tipo_plan", "asesor"),
    admin
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .gte("creado_en", inicioMes.toISOString()),
    admin
      .from("tenants")
      .select("tipo_plan, plan_tarifa, admins_extra, agentes_extra")
      .eq("plan_tarifa", "pago"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("estado", "cancelado"),
    admin.from("pedidos").select("id", { count: "exact", head: true }).eq("estado", "iniciado"),
    admin
      .from("tenants")
      .select("id, nombre, tipo_plan, plan_tarifa, pais, creado_en")
      .order("creado_en", { ascending: false }),
    admin.from("landing_visitas").select("fecha, dominio, visitas").order("fecha", { ascending: true }),
  ]);

  const mrr = (tenantsPago ?? []).reduce((suma, t) => suma + precioMensualTotal(config, t), 0);
  const tenants = (todosTenants ?? []) as TenantFila[];

  const kpis: {
    label: string;
    valor: string | number;
    nota?: string;
    icon: LucideIcon;
    color: keyof typeof COLORES_KPI;
    href: string;
  }[] = [
    {
      label: "Clientes activos",
      valor: clientesActivos ?? 0,
      nota: `${inmobiliarias ?? 0} inmobiliarias · ${asesores ?? 0} asesores`,
      icon: Users,
      color: "indigo",
      href: "/superadmin/clientes",
    },
    {
      label: "Clientes PRO",
      valor: tenantsPago?.length ?? 0,
      icon: Crown,
      color: "emerald",
      href: "/superadmin/suscripciones",
    },
    {
      label: "MRR",
      valor: `${mrr.toFixed(2).replace(".", ",")}€`,
      icon: TrendingUp,
      color: "emerald",
      href: "/superadmin/finanzas",
    },
    {
      label: "Pedidos pendientes",
      valor: pedidosPendientes ?? 0,
      nota: pedidosPendientes ? "esperando tu confirmación" : undefined,
      icon: Clock,
      color: "amber",
      href: "/superadmin/pedidos",
    },
    {
      label: "Nuevos este mes",
      valor: nuevosMes ?? 0,
      icon: UserPlus,
      color: "sky",
      href: "/superadmin/clientes",
    },
    {
      label: "Cancelados",
      valor: cancelados ?? 0,
      icon: UserMinus,
      color: "rose",
      href: "/superadmin/clientes",
    },
  ];

  const buckets = bucketsDeRegistros(rango, tenants);

  const porPais = new Map<string, number>();
  for (const t of tenants) {
    porPais.set(t.pais, (porPais.get(t.pais) ?? 0) + 1);
  }
  const paisesOrdenados = [...porPais.entries()].sort((a, b) => b[1] - a[1]);
  const maxPais = Math.max(1, ...paisesOrdenados.map(([, n]) => n));

  const ultimosRegistros = tenants.slice(0, 10);

  const visitas = visitasData ?? [];

  const visitasPorFecha = new Map<string, number>();
  for (const v of visitas) {
    visitasPorFecha.set(v.fecha, (visitasPorFecha.get(v.fecha) ?? 0) + v.visitas);
  }
  const bucketsVisitas = bucketsDeVisitas(visitasPorFecha);

  const hoyStr = new Date().toISOString().slice(0, 10);
  const inicioMesStr = inicioMes.toISOString().slice(0, 10);
  const visitasHoy = visitasPorFecha.get(hoyStr) ?? 0;
  const visitasMes = [...visitasPorFecha.entries()]
    .filter(([fecha]) => fecha >= inicioMesStr)
    .reduce((suma, [, v]) => suma + v, 0);
  const visitasTotal = visitas.reduce((suma, v) => suma + v.visitas, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel de Superadmin</h1>
        <p className="text-sm text-muted-foreground">Cómo va el negocio, de un vistazo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Registros</h2>
          <FiltroRango actual={rango} />
        </div>
        <GraficoRegistros buckets={buckets} rango={rango} />
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Visitas a la landing</h2>
        </div>
        {visitas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay visitas registradas. Se empiezan a contar solas en cuanto alguien entre en
            la landing pública.
          </p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xl font-semibold">{visitasHoy}</p>
                <p className="text-xs text-muted-foreground">Visitas hoy</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-semibold">{visitasMes}</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-semibold">{visitasTotal}</p>
                <p className="text-xs text-muted-foreground">Total histórico</p>
              </div>
            </div>
            <GraficoLinea buckets={bucketsVisitas} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold">Países</h2>
          <div className="space-y-2">
            {paisesOrdenados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay tenants.</p>
            ) : (
              paisesOrdenados.map(([codigo, n]) => (
                <div key={codigo} className="flex items-center gap-2 text-sm">
                  <span className="w-32 shrink-0 truncate">
                    {banderaPais(codigo)} {nombrePais(codigo)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(n / maxPais) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-muted-foreground">{n}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Últimos registros</h2>
            <Link href="/superadmin/clientes" className="text-xs font-medium text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="pb-2 font-medium">Nombre</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">País</th>
                  <th className="pb-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ultimosRegistros.map((t) => (
                  <tr key={t.id}>
                    <td className="py-1.5 pr-2 font-medium">{t.nombre}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground capitalize">{t.tipo_plan}</td>
                    <td className="py-1.5 pr-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          t.plan_tarifa === "pago"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {t.plan_tarifa === "pago" ? "PRO" : "Gratis"}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{banderaPais(t.pais)}</td>
                    <td className="py-1.5 text-muted-foreground">
                      {new Date(t.creado_en).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
