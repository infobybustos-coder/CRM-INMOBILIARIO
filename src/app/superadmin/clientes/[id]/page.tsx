import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { nombrePais, banderaPais } from "@/lib/paises";
import { precioPlan } from "@/lib/planes";
import { cn } from "@/lib/utils";
import { EstadoTenantAcciones } from "@/components/superadmin/estado-tenant-acciones";
import type { EstadoTenant } from "../actions";

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  activo: { texto: "Activo", clase: "bg-emerald-500/10 text-emerald-600" },
  suspendido: { texto: "Suspendido", clase: "bg-amber-500/10 text-amber-600" },
  cancelado: { texto: "Cancelado", clase: "bg-muted text-muted-foreground" },
};

function fecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ClienteFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, nombre, tipo_plan, plan_tarifa, pais, estado, creado_en")
    .eq("id", id)
    .maybeSingle();

  if (!tenant) notFound();

  const { data: usuarios } = await admin
    .from("usuarios")
    .select("nombre_completo, email, telefono, rol, ultimo_acceso")
    .eq("tenant_id", id);

  const contacto =
    (usuarios ?? []).find((u) => u.rol === "admin") ?? (usuarios ?? [])[0] ?? null;

  const estado = ETIQUETA_ESTADO[tenant.estado] ?? ETIQUETA_ESTADO.activo;

  const campos = [
    { label: "Nombre", valor: contacto?.nombre_completo ?? "—" },
    { label: "Empresa", valor: tenant.nombre },
    { label: "Email", valor: contacto?.email ?? "—" },
    { label: "WhatsApp", valor: contacto?.telefono ?? "—" },
    { label: "País", valor: `${banderaPais(tenant.pais)} ${nombrePais(tenant.pais)}` },
    { label: "Fecha registro", valor: fecha(tenant.creado_en) },
    { label: "Último acceso", valor: fecha(contacto?.ultimo_acceso ?? null) },
    {
      label: "Plan",
      valor:
        tenant.plan_tarifa === "pago"
          ? `${tenant.tipo_plan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} PRO (${precioPlan(tenant).toFixed(2).replace(".", ",")}€/mes)`
          : "Gratis",
    },
  ];

  return (
    <div className="max-w-lg space-y-4">
      <Link href="/superadmin/clientes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a Clientes
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{tenant.nombre}</h1>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estado.clase)}>
          {estado.texto}
        </span>
      </div>

      <div className="divide-y rounded-lg border">
        {campos.map((c) => (
          <div key={c.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="font-medium">{c.valor}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Gestionar cuenta</h2>
        <EstadoTenantAcciones tenantId={tenant.id} estadoActual={tenant.estado as EstadoTenant} />
      </div>
    </div>
  );
}
