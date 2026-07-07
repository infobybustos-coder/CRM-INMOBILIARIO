import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { nombrePais, banderaPais } from "@/lib/paises";
import { precioPlan, limiteRecurso, limiteAdmins, limiteEmpleados } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { cn } from "@/lib/utils";
import { EstadoTenantAcciones } from "@/components/superadmin/estado-tenant-acciones";
import { EditarEmpresaBoton } from "@/components/superadmin/editar-empresa-boton";
import { CambiarPlanBoton } from "@/components/superadmin/cambiar-plan-boton";
import { EliminarTenantBoton } from "@/components/superadmin/eliminar-tenant-boton";
import { AccederComoBoton } from "@/components/superadmin/acceder-como-boton";
import { NotasInternas } from "@/components/superadmin/notas-internas";
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

function fechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ClienteFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const config = await obtenerConfigPlanes();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, nombre, tipo_plan, plan_tarifa, pais, estado, admins_extra, agentes_extra, creado_en")
    .eq("id", id)
    .maybeSingle();

  if (!tenant) notFound();

  const [
    { data: usuarios },
    { data: eventos },
    { data: notas },
    { count: numPropietarios },
    { count: numInmuebles },
    { count: numCompradores },
  ] = await Promise.all([
    admin
      .from("usuarios")
      .select("id, nombre_completo, email, telefono, rol, ultimo_acceso")
      .eq("tenant_id", id),
    admin
      .from("tenant_eventos")
      .select("id, tipo, descripcion, creado_en")
      .eq("tenant_id", id)
      .order("creado_en", { ascending: false }),
    admin
      .from("tenant_notas")
      .select("id, texto, creado_por, creado_en")
      .eq("tenant_id", id)
      .order("creado_en", { ascending: false }),
    admin.from("propietarios").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    admin.from("inmuebles").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    admin.from("compradores").select("id", { count: "exact", head: true }).eq("tenant_id", id),
  ]);

  const contacto = (usuarios ?? []).find((u) => u.rol === "admin") ?? (usuarios ?? [])[0] ?? null;
  const estado = ETIQUETA_ESTADO[tenant.estado] ?? ETIQUETA_ESTADO.activo;
  const cambiosDePlan = (eventos ?? []).filter((e) => e.tipo === "plan");

  const numAdmins = (usuarios ?? []).filter((u) => u.rol === "admin").length;
  const numEmpleados = (usuarios ?? []).filter((u) => u.rol === "empleado").length;

  const conLimite = (actual: number, limite: number | null) =>
    limite === null ? `${actual} (ilimitado)` : `${actual} / ${limite}`;

  const usoRecursos = [
    { label: "Propietarios", valor: conLimite(numPropietarios ?? 0, limiteRecurso(config, tenant, "propietarios")) },
    { label: "Inmuebles", valor: conLimite(numInmuebles ?? 0, limiteRecurso(config, tenant, "inmuebles")) },
    { label: "Compradores", valor: conLimite(numCompradores ?? 0, limiteRecurso(config, tenant, "compradores")) },
    ...(tenant.tipo_plan === "inmobiliaria"
      ? [
          { label: "Administradores", valor: conLimite(numAdmins, limiteAdmins(config, tenant)) },
          { label: "Asesores", valor: conLimite(numEmpleados, limiteEmpleados(config, tenant)) },
        ]
      : []),
  ];

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
          ? `${tenant.tipo_plan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} PRO (${precioPlan(config, tenant).toFixed(2).replace(".", ",")}€/mes)`
          : "Gratis",
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/superadmin/clientes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a Clientes
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{tenant.nombre}</h1>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estado.clase)}>{estado.texto}</span>
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
        <h2 className="text-sm font-semibold">Uso actual</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {usoRecursos.map((u) => (
            <div key={u.label} className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{u.valor}</p>
              <p className="text-xs text-muted-foreground">{u.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Usuarios</h2>
        {(usuarios ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin usuarios.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {(usuarios ?? []).map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{u.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.email} · {u.rol === "admin" ? "Administrador/a" : "Empleado/a"}
                  </p>
                </div>
                <AccederComoBoton usuarioId={u.id} nombre={u.nombre_completo ?? u.email} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Gestionar cuenta</h2>
        <div className="flex flex-wrap gap-2">
          <EditarEmpresaBoton tenantId={tenant.id} nombreActual={tenant.nombre} paisActual={tenant.pais} />
          <EstadoTenantAcciones tenantId={tenant.id} estadoActual={tenant.estado as EstadoTenant} />
          <CambiarPlanBoton
            tenantId={tenant.id}
            tipoPlanActual={tenant.tipo_plan}
            planTarifaActual={tenant.plan_tarifa}
          />
          <EliminarTenantBoton tenantId={tenant.id} nombreTenant={tenant.nombre} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Notas internas</h2>
        <NotasInternas tenantId={tenant.id} notas={notas ?? []} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Historial</h2>
          {(eventos ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin eventos todavía.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {(eventos ?? []).map((e) => (
                <li key={e.id} className="rounded-md border p-2">
                  <p>{e.descripcion}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{fechaHora(e.creado_en)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Cambios de plan</h2>
          {cambiosDePlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cambios de plan todavía.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {cambiosDePlan.map((e) => (
                <li key={e.id} className="rounded-md border p-2">
                  <p>{e.descripcion}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{fechaHora(e.creado_en)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {["Pagos", "Incidencias", "Tickets"].map((seccion) => (
          <div key={seccion} className="space-y-1 rounded-lg border border-dashed p-4">
            <h2 className="text-sm font-semibold text-muted-foreground">{seccion}</h2>
            <p className="text-xs text-muted-foreground">
              Próximamente — necesita infraestructura nueva ({seccion === "Pagos" ? "pasarela de pago" : "sistema de tickets"}).
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
