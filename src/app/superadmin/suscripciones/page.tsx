import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { precioMensualTotal } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { cn } from "@/lib/utils";
import { AccionesFilaSuscripcion } from "@/components/superadmin/acciones-fila-suscripcion";
import { ConfigPlanesEditor } from "@/components/superadmin/config-planes-editor";
import type { EstadoTenant } from "../clientes/actions";

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  activo: { texto: "Activo", clase: "bg-emerald-500/10 text-emerald-600" },
  suspendido: { texto: "Suspendido", clase: "bg-amber-500/10 text-amber-600" },
  cancelado: { texto: "Cancelado", clase: "bg-muted text-muted-foreground" },
};

export default async function SuscripcionesPage() {
  const admin = createAdminClient();
  const config = await obtenerConfigPlanes();

  const { data: tenants } = await admin
    .from("tenants")
    .select("id, nombre, tipo_plan, plan_tarifa, estado, admins_extra, agentes_extra, creado_en")
    .eq("es_demo", false)
    .order("creado_en", { ascending: false });

  const todos = tenants ?? [];
  const dePago = todos.filter((t) => t.plan_tarifa === "pago");
  const gratis = todos.filter((t) => t.plan_tarifa !== "pago");
  const cancelados = todos.filter((t) => t.estado === "cancelado");

  const idsInmobiliaria = todos.filter((t) => t.tipo_plan === "inmobiliaria").map((t) => t.id);
  const { data: usuariosEquipo } = await admin
    .from("usuarios")
    .select("tenant_id, rol, activo")
    .in("tenant_id", idsInmobiliaria);

  const equipoPorTenant = new Map<string, { admins: number; asesores: number }>();
  for (const u of usuariosEquipo ?? []) {
    if (!u.activo) continue;
    const actual = equipoPorTenant.get(u.tenant_id) ?? { admins: 0, asesores: 0 };
    if (u.rol === "admin") actual.admins += 1;
    else actual.asesores += 1;
    equipoPorTenant.set(u.tenant_id, actual);
  }

  const mrr = dePago.reduce((suma, t) => suma + precioMensualTotal(config, t), 0);
  const euros = (n: number) => `${n.toFixed(2).replace(".", ",")}€`;

  const kpis = [
    { label: "MRR", valor: euros(mrr) },
    { label: "Clientes PRO", valor: dePago.length },
    { label: "Clientes FREE", valor: gratis.length },
    { label: "Renovaciones próximas", valor: "—", nota: "sin facturación real todavía" },
    { label: "Pagos fallidos", valor: "—", nota: "sin pasarela de pago" },
    { label: "Cancelaciones", valor: cancelados.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Suscripciones</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{k.valor}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            {"nota" in k && k.nota && <p className="mt-1 text-[10px] text-muted-foreground/70">{k.nota}</p>}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">Equipo</th>
              <th className="px-3 py-2 font-medium">Precio</th>
              <th className="px-3 py-2 font-medium">Renovación</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {todos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Todavía no hay tenants.
                </td>
              </tr>
            ) : (
              todos.map((t) => {
                const estado = ETIQUETA_ESTADO[t.estado] ?? ETIQUETA_ESTADO.activo;
                const equipo = equipoPorTenant.get(t.id);
                return (
                  <tr key={t.id}>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/superadmin/clientes/${t.id}`} className="text-primary hover:underline">
                        {t.nombre}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground capitalize">
                      {t.tipo_plan} {t.plan_tarifa === "pago" ? "PRO" : "Gratis"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t.tipo_plan === "inmobiliaria"
                        ? `${equipo?.admins ?? 0} admin · ${equipo?.asesores ?? 0} asesores`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">{euros(precioMensualTotal(config, t))}</td>
                    <td className="px-3 py-2 text-muted-foreground">—</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estado.clase)}>
                        {estado.texto}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <AccionesFilaSuscripcion
                        tenantId={t.id}
                        estado={t.estado as EstadoTenant}
                        tipoPlan={t.tipo_plan}
                        planTarifa={t.plan_tarifa}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Configuración de planes</h2>
          <p className="text-sm text-muted-foreground">
            Cambia estos números cuando quieras — se aplican al momento, sin tocar código.
          </p>
        </div>
        <ConfigPlanesEditor config={config} />
      </div>
    </div>
  );
}
