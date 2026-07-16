import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { nombrePais, banderaPais } from "@/lib/paises";
import { precioPlan, limiteRecurso, limiteAdmins, limiteEmpleados } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { estaConectado, tiempoDesde } from "@/lib/actividad-tiempo";
import { listarConversacionesTenant } from "@/lib/soporte/db";
import { cn } from "@/lib/utils";
import { EstadoTenantAcciones } from "@/components/superadmin/estado-tenant-acciones";
import { EditarEmpresaBoton } from "@/components/superadmin/editar-empresa-boton";
import { CambiarPlanBoton } from "@/components/superadmin/cambiar-plan-boton";
import { EliminarTenantBoton } from "@/components/superadmin/eliminar-tenant-boton";
import { AccederComoBoton } from "@/components/superadmin/acceder-como-boton";
import { RestablecerPasswordBoton } from "@/components/superadmin/restablecer-password-boton";
import { NotasInternas } from "@/components/superadmin/notas-internas";
import { WhatsAppBoton } from "@/components/superadmin/whatsapp-boton";
import { BadgeEstado } from "@/components/soporte/badge-estado";
import type { EstadoTenant } from "../actions";

function formatearBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  activo: { texto: "Activo", clase: "bg-emerald-500/10 text-emerald-600" },
  suspendido: { texto: "Suspendido", clase: "bg-amber-500/10 text-amber-600" },
  cancelado: { texto: "Cancelado", clase: "bg-muted text-muted-foreground" },
};

const ETIQUETA_ESTADO_PEDIDO: Record<string, { texto: string; clase: string }> = {
  iniciado: { texto: "Pendiente", clase: "bg-amber-500/10 text-amber-600" },
  pagado: { texto: "Pagado", clase: "bg-emerald-500/10 text-emerald-600" },
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
    { data: pedidos },
    { count: numPropietarios },
    { count: numInmuebles },
    { count: numCompradores },
    { count: numVisitas },
    { count: numTareas },
    { data: documentos },
    conversaciones,
  ] = await Promise.all([
    admin
      .from("usuarios")
      .select("id, nombre_completo, email, telefono, rol, ultimo_acceso, ultima_actividad")
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
    admin
      .from("pedidos")
      .select("id, concepto, importe, metodo_pago, estado, creado_en")
      .eq("tenant_id", id)
      .order("creado_en", { ascending: false }),
    admin.from("propietarios").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    admin.from("inmuebles").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    admin.from("compradores").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    admin
      .from("eventos_agenda")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", id)
      .eq("tipo", "visita"),
    admin.from("tareas").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    admin.from("documentos").select("tamano_bytes").eq("tenant_id", id),
    listarConversacionesTenant(admin, id),
  ]);

  const espacioUtilizado = (documentos ?? []).reduce((total, d) => total + (d.tamano_bytes ?? 0), 0);
  const ultimaActividadTenant = (usuarios ?? []).reduce<string | null>((max, u) => {
    if (!u.ultima_actividad) return max;
    return !max || u.ultima_actividad > max ? u.ultima_actividad : max;
  }, null);
  const conectadoAhora = estaConectado(ultimaActividadTenant);

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
    { label: "Visitas", valor: String(numVisitas ?? 0) },
    { label: "Tareas", valor: String(numTareas ?? 0) },
    ...(tenant.tipo_plan === "inmobiliaria"
      ? [
          { label: "Administradores", valor: conLimite(numAdmins, limiteAdmins(config, tenant)) },
          { label: "Asesores", valor: conLimite(numEmpleados, limiteEmpleados(config, tenant)) },
        ]
      : []),
    { label: "Espacio usado", valor: formatearBytes(espacioUtilizado) },
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
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn("size-2 rounded-full", conectadoAhora ? "bg-emerald-500" : "bg-muted-foreground/30")}
            />
            {conectadoAhora ? "Conectado ahora" : `Actividad: ${tiempoDesde(ultimaActividadTenant)}`}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estado.clase)}>{estado.texto}</span>
        </div>
      </div>

      <div className="divide-y rounded-lg border">
        {campos.map((c) => (
          <div key={c.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="flex items-center gap-2 font-medium">
              {c.valor}
              {c.label === "WhatsApp" && (
                <WhatsAppBoton telefono={contacto?.telefono} nombre={contacto?.nombre_completo} />
              )}
            </span>
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
            {(usuarios ?? []).map((u) => {
              const usuarioConectado = estaConectado(u.ultima_actividad);
              return (
                <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{u.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · {u.rol === "admin" ? "Administrador/a" : "Empleado/a"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          usuarioConectado ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )}
                      />
                      {usuarioConectado ? "Conectado" : tiempoDesde(u.ultima_actividad)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RestablecerPasswordBoton usuarioId={u.id} tenantId={tenant.id} />
                    <AccederComoBoton usuarioId={u.id} nombre={u.nombre_completo ?? u.email} />
                  </div>
                </div>
              );
            })}
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

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Pagos</h2>
        {(pedidos ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin pedidos todavía.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {(pedidos ?? []).map((p) => {
              const estadoPedido = ETIQUETA_ESTADO_PEDIDO[p.estado] ?? ETIQUETA_ESTADO_PEDIDO.iniciado;
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{p.concepto}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.metodo_pago} · {fechaHora(p.creado_en)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{Number(p.importe).toFixed(2).replace(".", ",")}€</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estadoPedido.clase)}>
                      {estadoPedido.texto}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Conversaciones de soporte</h2>
        {conversaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin conversaciones de soporte todavía.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {conversaciones.map((c) => (
              <Link
                key={c.id}
                href={`/superadmin/soporte?c=${c.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/50"
              >
                <div>
                  <p className="font-medium">{c.asunto}</p>
                  <p className="text-xs text-muted-foreground">{fechaHora(c.actualizadoEn)}</p>
                </div>
                <BadgeEstado estado={c.estado} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
