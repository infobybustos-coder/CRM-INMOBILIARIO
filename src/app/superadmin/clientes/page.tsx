import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { nombrePais, banderaPais } from "@/lib/paises";
import { precioPlan } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { estaConectado, tiempoDesde } from "@/lib/actividad-tiempo";
import { cn } from "@/lib/utils";
import { ClientesFiltros } from "@/components/superadmin/clientes-filtros";
import { WhatsAppBoton } from "@/components/superadmin/whatsapp-boton";
import { EliminarTenantBoton } from "@/components/superadmin/eliminar-tenant-boton";

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  activo: { texto: "Activo", clase: "bg-emerald-500/10 text-emerald-600" },
  suspendido: { texto: "Suspendido", clase: "bg-amber-500/10 text-amber-600" },
  cancelado: { texto: "Cancelado", clase: "bg-muted text-muted-foreground" },
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const admin = createAdminClient();
  const config = await obtenerConfigPlanes();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    { count: activos },
    { count: free },
    { count: pro },
    { count: suspendidos },
    { count: cancelados },
    { count: nuevosMes },
    { data: todosPaises },
  ] = await Promise.all([
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("estado", "activo"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("plan_tarifa", "gratis"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("plan_tarifa", "pago"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("estado", "suspendido"),
    admin.from("tenants").select("id", { count: "exact", head: true }).eq("estado", "cancelado"),
    admin
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .gte("creado_en", inicioMes.toISOString()),
    admin.from("tenants").select("pais"),
  ]);

  let query = admin
    .from("tenants")
    .select("id, nombre, tipo_plan, plan_tarifa, pais, estado, creado_en")
    .order("creado_en", { ascending: false });

  if (params.plan === "gratis" || params.plan === "pago") query = query.eq("plan_tarifa", params.plan);
  if (params.tipo === "asesor" || params.tipo === "inmobiliaria") query = query.eq("tipo_plan", params.tipo);
  if (params.pais) query = query.eq("pais", params.pais);

  const { data: tenants } = await query;

  const { data: usuarios } = await admin
    .from("usuarios")
    .select("id, tenant_id, nombre_completo, email, telefono, rol, ultima_actividad")
    .in("tenant_id", (tenants ?? []).map((t) => t.id));

  const contactoPorTenant = new Map<string, NonNullable<typeof usuarios>[number]>();
  const actividadPorTenant = new Map<string, string | null>();
  for (const u of usuarios ?? []) {
    const actual = contactoPorTenant.get(u.tenant_id);
    if (!actual || u.rol === "admin") contactoPorTenant.set(u.tenant_id, u);

    const previa = actividadPorTenant.get(u.tenant_id);
    if (u.ultima_actividad && (!previa || u.ultima_actividad > previa)) {
      actividadPorTenant.set(u.tenant_id, u.ultima_actividad);
    }
  }

  const paisesDisponibles = [...new Set((todosPaises ?? []).map((t) => t.pais))].sort((a, b) =>
    nombrePais(a).localeCompare(nombrePais(b))
  );

  const kpis = [
    { label: "Clientes activos", valor: activos ?? 0 },
    { label: "FREE", valor: free ?? 0 },
    { label: "PRO", valor: pro ?? 0 },
    { label: "Suspendidos", valor: suspendidos ?? 0 },
    { label: "Cancelados", valor: cancelados ?? 0 },
    { label: "Nuevos este mes", valor: nuevosMes ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex gap-2">
          <Link
            href={`/superadmin/clientes/exportar?${new URLSearchParams(
              Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]))
            ).toString()}`}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Exportar a Excel
          </Link>
          <Link
            href="/superadmin/clientes/nuevo"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + Nuevo cliente
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{k.valor}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <ClientesFiltros paisesDisponibles={paisesDisponibles} />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Empresa</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">País</th>
              <th className="px-3 py-2 font-medium">WhatsApp</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Actividad</th>
              <th className="px-3 py-2 font-medium">Registro</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(tenants ?? []).length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                  No hay tenants con esos filtros.
                </td>
              </tr>
            ) : (
              (tenants ?? []).map((t) => {
                const contacto = contactoPorTenant.get(t.id);
                const estado = ETIQUETA_ESTADO[t.estado] ?? ETIQUETA_ESTADO.activo;
                const ultimaActividad = actividadPorTenant.get(t.id) ?? null;
                const conectado = estaConectado(ultimaActividad);
                return (
                  <tr key={t.id} className="hover:bg-accent/50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/superadmin/clientes/${t.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {contacto?.nombre_completo ?? "—"}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{t.nombre}</td>
                    <td className="px-3 py-2 text-muted-foreground capitalize">{t.tipo_plan}</td>
                    <td className="px-3 py-2">
                      {t.plan_tarifa === "pago" ? "PRO" : "Gratis"}
                      {t.plan_tarifa === "pago" && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({precioPlan(config, t).toFixed(2).replace(".", ",")}€/mes)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {banderaPais(t.pais)} {nombrePais(t.pais)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {contacto?.telefono ?? "—"}
                        <WhatsAppBoton telefono={contacto?.telefono} nombre={contacto?.nombre_completo} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{contacto?.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estado.clase)}>
                        {estado.texto}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            conectado ? "bg-emerald-500" : "bg-muted-foreground/30"
                          )}
                        />
                        {conectado ? "Conectado" : tiempoDesde(ultimaActividad)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(t.creado_en).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <EliminarTenantBoton tenantId={t.id} nombreTenant={t.nombre} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
