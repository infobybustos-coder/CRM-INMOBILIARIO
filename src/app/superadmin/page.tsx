import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { precioMensualTotal } from "@/lib/planes";
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

function Kpi({ label, valor, nota }: { label: string; valor: string | number; nota?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold">{valor}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {nota && <p className="mt-1 text-[10px] text-muted-foreground/70">{nota}</p>}
    </div>
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
              className="w-full max-w-6 rounded-t-sm bg-primary transition-colors group-hover:bg-primary/80"
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

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const [
    { count: clientesActivos },
    { count: inmobiliarias },
    { count: asesores },
    { count: registrosHoy },
    { data: tenantsPago },
    { count: clientesFree },
    { count: cancelaciones },
    { data: todosTenants },
  ] = await Promise.all([
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("activo", true),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("tipo_plan", "inmobiliaria"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("tipo_plan", "asesor"),
    admin
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .gte("creado_en", inicioHoy.toISOString()),
    admin
      .from("tenants")
      .select("tipo_plan, plan_tarifa, admins_extra, agentes_extra")
      .eq("plan_tarifa", "pago"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("plan_tarifa", "gratis"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("activo", false),
    admin
      .from("tenants")
      .select("id, nombre, tipo_plan, plan_tarifa, pais, creado_en")
      .order("creado_en", { ascending: false }),
  ]);

  const mrr = (tenantsPago ?? []).reduce((suma, t) => suma + precioMensualTotal(t), 0);
  const tenants = (todosTenants ?? []) as TenantFila[];

  const kpisFila1 = [
    { label: "Clientes activos", valor: clientesActivos ?? 0 },
    { label: "Inmobiliarias", valor: inmobiliarias ?? 0 },
    { label: "Asesores", valor: asesores ?? 0 },
    { label: "Registros hoy", valor: registrosHoy ?? 0 },
    { label: "MRR", valor: `${mrr.toFixed(2).replace(".", ",")}€` },
    {
      label: "Facturación del mes",
      valor: `${mrr.toFixed(2).replace(".", ",")}€`,
      nota: "estimado según planes activos",
    },
  ];

  const kpisFila2 = [
    { label: "Visitas web", valor: "—", nota: "sin analítica conectada" },
    { label: "Conversión registro", valor: "—", nota: "sin analítica conectada" },
    { label: "Clientes PRO", valor: tenantsPago?.length ?? 0 },
    { label: "Clientes FREE", valor: clientesFree ?? 0 },
    { label: "Cancelaciones", valor: cancelaciones ?? 0, nota: "cuentas inactivas" },
    { label: "Tickets abiertos", valor: "—", nota: "sin sistema de tickets" },
  ];

  const buckets = bucketsDeRegistros(rango, tenants);

  const porPais = new Map<string, number>();
  for (const t of tenants) {
    porPais.set(t.pais, (porPais.get(t.pais) ?? 0) + 1);
  }
  const paisesOrdenados = [...porPais.entries()].sort((a, b) => b[1] - a[1]);
  const maxPais = Math.max(1, ...paisesOrdenados.map(([, n]) => n));

  const ultimosRegistros = tenants.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel de Superadmin</h1>
        <p className="text-sm text-muted-foreground">Vista general de todos los tenants del CRM.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpisFila1.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpisFila2.map((k) => (
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
                      className="h-full rounded-full bg-primary"
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
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {t.plan_tarifa === "pago" ? "PRO" : "Gratis"}
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
