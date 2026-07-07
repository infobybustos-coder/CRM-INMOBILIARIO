import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { precioMensualTotal, precioPlan } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { banderaPais, nombrePais } from "@/lib/paises";

type Tenant = {
  id: string;
  tipo_plan: string;
  plan_tarifa: string;
  pais: string;
  admins_extra: number | null;
  agentes_extra: number | null;
};

function euros(n: number) {
  return `${n.toFixed(2).replace(".", ",")}€`;
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

function GraficoMRR({ puntos }: { puntos: { fecha: string; mrr: number }[] }) {
  const max = Math.max(1, ...puntos.map((p) => p.mrr));
  return (
    <div className="flex h-40 items-end gap-1">
      {puntos.map((p, i) => (
        <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end">
          <div
            className="w-full max-w-8 rounded-t-sm bg-primary transition-colors group-hover:bg-primary/80"
            style={{ height: `${(p.mrr / max) * 100}%`, minHeight: p.mrr > 0 ? "2px" : "0" }}
          />
          <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 transition-opacity group-hover:opacity-100">
            {new Date(p.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}: {euros(p.mrr)}
          </div>
          <p className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">
            {new Date(p.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function FinanzasPage() {
  const admin = createAdminClient();
  const config = await obtenerConfigPlanes();

  const { data: tenantsData } = await admin
    .from("tenants")
    .select("id, tipo_plan, plan_tarifa, pais, admins_extra, agentes_extra");
  const tenants = (tenantsData ?? []) as Tenant[];
  const dePago = tenants.filter((t) => t.plan_tarifa === "pago");

  const mrr = dePago.reduce((suma, t) => suma + precioMensualTotal(config, t), 0);
  const ingresosAsesor = dePago
    .filter((t) => t.tipo_plan === "asesor")
    .reduce((suma, t) => suma + precioMensualTotal(config, t), 0);
  const ingresosInmobiliaria = dePago
    .filter((t) => t.tipo_plan === "inmobiliaria")
    .reduce((suma, t) => suma + precioMensualTotal(config, t), 0);
  const ingresosBase = dePago.reduce((suma, t) => suma + precioPlan(config, t), 0);
  const ingresosAsientosExtra = mrr - ingresosBase;
  const arpu = dePago.length > 0 ? mrr / dePago.length : 0;

  const hoy = new Date();
  const fechaHoy = hoy.toISOString().slice(0, 10);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();

  const { count: cancelacionesMes } = await admin
    .from("tenant_eventos")
    .select("id", { count: "exact", head: true })
    .eq("tipo", "estado")
    .ilike("descripcion", "%Cancelado%")
    .gte("creado_en", inicioMes);

  // Guarda la foto de hoy (idempotente) para poder pintar la evolución.
  await admin.from("mrr_snapshots").upsert(
    { fecha: fechaHoy, mrr, clientes_pro: dePago.length, clientes_free: tenants.length - dePago.length },
    { onConflict: "fecha" }
  );

  const { data: historico } = await admin
    .from("mrr_snapshots")
    .select("fecha, mrr")
    .order("fecha", { ascending: true })
    .limit(90);
  const puntos = historico ?? [];

  const ingresoPorPais = new Map<string, number>();
  for (const t of dePago) {
    ingresoPorPais.set(t.pais, (ingresoPorPais.get(t.pais) ?? 0) + precioMensualTotal(config, t));
  }
  const paisesOrdenados = [...ingresoPorPais.entries()].sort((a, b) => b[1] - a[1]);
  const maxPais = Math.max(1, ...paisesOrdenados.map(([, n]) => n));

  const { data: pagosConfirmados } = await admin
    .from("pedidos")
    .select("importe, metodo_pago")
    .eq("estado", "pagado");
  const importePorMetodo = new Map<string, number>();
  for (const p of pagosConfirmados ?? []) {
    importePorMetodo.set(p.metodo_pago, (importePorMetodo.get(p.metodo_pago) ?? 0) + Number(p.importe));
  }
  const metodosOrdenados = [...importePorMetodo.entries()].sort((a, b) => b[1] - a[1]);
  const maxMetodo = Math.max(1, ...metodosOrdenados.map(([, n]) => n));

  const kpis = [
    { label: "MRR", valor: euros(mrr) },
    { label: "Ingreso medio por cliente (ARPU)", valor: euros(arpu) },
    { label: "Ingresos Asesor PRO", valor: euros(ingresosAsesor) },
    { label: "Ingresos Inmobiliaria PRO", valor: euros(ingresosInmobiliaria) },
    { label: "Clientes de pago", valor: dePago.length },
    { label: "Cancelaciones este mes", valor: cancelacionesMes ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finanzas</h1>
        <p className="text-sm text-muted-foreground">
          Solo cuenta clientes con un pago confirmado de verdad en{" "}
          <Link href="/superadmin/pedidos" className="text-primary hover:underline">
            Pedidos
          </Link>{" "}
          — nada de esto se activa hasta que tú lo confirmas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-1 text-sm font-semibold">Evolución del MRR</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Se registra una foto diaria a partir de hoy — todavía no hay histórico anterior.
        </p>
        {puntos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
        ) : (
          <GraficoMRR puntos={puntos} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold">De dónde viene el MRR</h2>
          <div className="divide-y text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Planes Asesor PRO</span>
              <span className="font-medium">
                {euros(
                  dePago
                    .filter((t) => t.tipo_plan === "asesor")
                    .reduce((s, t) => s + precioPlan(config, t), 0)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Planes Inmobiliaria PRO</span>
              <span className="font-medium">
                {euros(
                  dePago
                    .filter((t) => t.tipo_plan === "inmobiliaria")
                    .reduce((s, t) => s + precioPlan(config, t), 0)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Administradores / asesores extra</span>
              <span className="font-medium">{euros(ingresosAsientosExtra)}</span>
            </div>
            <div className="flex items-center justify-between py-2 font-semibold">
              <span>Total MRR</span>
              <span>{euros(mrr)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold">Ingresos por país</h2>
          <div className="space-y-2">
            {paisesOrdenados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay clientes de pago.</p>
            ) : (
              paisesOrdenados.map(([codigo, valor]) => (
                <div key={codigo} className="flex items-center gap-2 text-sm">
                  <span className="w-32 shrink-0 truncate">
                    {banderaPais(codigo)} {nombrePais(codigo)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(valor / maxPais) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-muted-foreground">{euros(valor)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Ingresos por método de pago (histórico)</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Suma de todos los pedidos marcados como pagados alguna vez, no solo los activos ahora
            mismo.
          </p>
          {metodosOrdenados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay pagos confirmados.</p>
          ) : (
            <div className="space-y-2">
              {metodosOrdenados.map(([metodo, valor]) => (
                <div key={metodo} className="flex items-center gap-2 text-sm">
                  <span className="w-40 shrink-0 truncate">{metodo}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(valor / maxMetodo) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-muted-foreground">{euros(valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
