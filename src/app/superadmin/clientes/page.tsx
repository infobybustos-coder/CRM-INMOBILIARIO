import { createAdminClient } from "@/lib/supabase/admin";
import { nombrePais, banderaPais } from "@/lib/paises";
import { precioPlan } from "@/lib/planes";
import { cn } from "@/lib/utils";

export default async function ClientesPage() {
  const admin = createAdminClient();

  const [{ data: tenants }, { data: usuarios }] = await Promise.all([
    admin
      .from("tenants")
      .select("id, nombre, tipo_plan, plan_tarifa, pais, activo, creado_en")
      .order("creado_en", { ascending: false }),
    admin.from("usuarios").select("tenant_id"),
  ]);

  const usuariosPorTenant = new Map<string, number>();
  for (const u of usuarios ?? []) {
    usuariosPorTenant.set(u.tenant_id, (usuariosPorTenant.get(u.tenant_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <p className="text-sm text-muted-foreground">
        {tenants?.length ?? 0} tenants dados de alta en el CRM.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">País</th>
              <th className="px-3 py-2 font-medium">Usuarios</th>
              <th className="px-3 py-2 font-medium">Alta</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(tenants ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-3 py-2 font-medium">{t.nombre}</td>
                <td className="px-3 py-2 capitalize text-muted-foreground">{t.tipo_plan}</td>
                <td className="px-3 py-2">
                  {t.plan_tarifa === "pago" ? "PRO" : "Gratis"}
                  {t.plan_tarifa === "pago" && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({precioPlan(t).toFixed(2).replace(".", ",")}€/mes)
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {banderaPais(t.pais)} {nombrePais(t.pais)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {usuariosPorTenant.get(t.id) ?? 0}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(t.creado_en).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      t.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {t.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
