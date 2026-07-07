import { createAdminClient } from "@/lib/supabase/admin";

export default async function SuperadminPage() {
  const admin = createAdminClient();

  const [
    { count: totalTenants },
    { count: tenantsAsesor },
    { count: tenantsInmobiliaria },
    { count: tenantsPago },
    { count: totalUsuarios },
  ] = await Promise.all([
    admin.from("tenants").select("id", { count: "exact", head: true }),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("tipo_plan", "asesor"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("tipo_plan", "inmobiliaria"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("plan_tarifa", "pago"),
    admin.from("usuarios").select("id", { count: "exact", head: true }),
  ]);

  const kpis = [
    { label: "Tenants totales", valor: totalTenants ?? 0 },
    { label: "Asesores independientes", valor: tenantsAsesor ?? 0 },
    { label: "Inmobiliarias", valor: tenantsInmobiliaria ?? 0 },
    { label: "En plan de pago", valor: tenantsPago ?? 0 },
    { label: "Usuarios totales", valor: totalUsuarios ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Panel de Superadmin</h1>
      <p className="text-sm text-muted-foreground">
        Vista general de todos los tenants del CRM.
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{k.valor}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Aquí iremos añadiendo la gestión de tenants, suscripciones y soporte.
      </p>
    </div>
  );
}
