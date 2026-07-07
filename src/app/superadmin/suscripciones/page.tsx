import { createAdminClient } from "@/lib/supabase/admin";
import { precioMensualTotal, PRECIO_MENSUAL } from "@/lib/planes";

export default async function SuscripcionesPage() {
  const admin = createAdminClient();

  const { data: tenants } = await admin
    .from("tenants")
    .select("id, nombre, tipo_plan, plan_tarifa, admins_extra, agentes_extra");

  const todos = tenants ?? [];
  const dePago = todos.filter((t) => t.plan_tarifa === "pago");
  const gratis = todos.filter((t) => t.plan_tarifa !== "pago");

  const mrr = dePago.reduce((suma, t) => suma + precioMensualTotal(t), 0);
  const mrrAsesor = dePago
    .filter((t) => t.tipo_plan === "asesor")
    .reduce((suma, t) => suma + precioMensualTotal(t), 0);
  const mrrInmobiliaria = dePago
    .filter((t) => t.tipo_plan === "inmobiliaria")
    .reduce((suma, t) => suma + precioMensualTotal(t), 0);

  const euros = (n: number) => `${n.toFixed(2).replace(".", ",")}€`;

  const kpis = [
    { label: "MRR total", valor: euros(mrr) },
    { label: "Tenants de pago", valor: dePago.length },
    { label: "Tenants en Gratis", valor: gratis.length },
    { label: "MRR Asesor", valor: euros(mrrAsesor) },
    { label: "MRR Inmobiliaria", valor: euros(mrrInmobiliaria) },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Suscripciones</h1>
      <p className="text-sm text-muted-foreground">
        Plan Asesor: {PRECIO_MENSUAL.asesor.toFixed(2).replace(".", ",")}€/mes · Plan
        Inmobiliaria: {PRECIO_MENSUAL.inmobiliaria.toFixed(2).replace(".", ",")}€/mes
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{k.valor}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Tenant</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Asientos extra</th>
              <th className="px-3 py-2 font-medium">Precio/mes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dePago.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Todavía no hay tenants en plan de pago.
                </td>
              </tr>
            ) : (
              dePago.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2 font-medium">{t.nombre}</td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">{t.tipo_plan}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {(t.admins_extra ?? 0) === 0 && (t.agentes_extra ?? 0) === 0
                      ? "—"
                      : `${t.admins_extra ?? 0} admin(es), ${t.agentes_extra ?? 0} asesor(es)`}
                  </td>
                  <td className="px-3 py-2">{euros(precioMensualTotal(t))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
