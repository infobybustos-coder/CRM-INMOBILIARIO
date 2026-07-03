import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VistaSwitcher } from "@/components/inmobiliaria/vista-switcher";
import { TablaPropietarios } from "@/components/inmobiliaria/propietarios/tabla-propietarios";
import { KanbanPropietarios } from "@/components/inmobiliaria/propietarios/kanban-propietarios";
import { RefreshButton } from "@/components/inmobiliaria/refresh-button";
import { calcularPrioridad, diasDesde } from "@/lib/prioridad";

const BASE = "/inmobiliaria/propietarios";

export default async function InmobiliariaPropietariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const params = await searchParams;
  const vista = params.vista === "tabla" ? "tabla" : "kanban";
  const gestor = esGestor(usuario.rol);

  const supabase = await createClient();

  let query = supabase
    .from("propietarios")
    .select(
      "id, nombre, telefono, email, whatsapp, direccion, tipo_inmueble, estado, valor_estimado, fecha_ultimo_contacto, fecha_proxima_accion, fuente_lead, notas, creado_en, agente_id"
    );

  if (!gestor) query = query.eq("agente_id", usuario.id);
  else if (params.agente_id) query = query.eq("agente_id", params.agente_id);
  if (params.estado) query = query.eq("estado", params.estado);

  const [{ data }, { data: usuariosData }] = await Promise.all([
    query.order("creado_en", { ascending: false }),
    supabase
      .from("usuarios")
      .select("id, nombre_completo")
      .eq("tenant_id", usuario.tenant_id)
      .eq("activo", true),
  ]);

  const propietarios = data ?? [];
  const agentes: Record<string, string> = Object.fromEntries(
    (usuariosData ?? []).map((u) => [u.id, u.nombre_completo])
  );
  const agentesArray = (usuariosData ?? []).map((u) => ({ id: u.id, nombre_completo: u.nombre_completo }));

  // KPIs
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);

  const nuevos = propietarios.filter((p) => new Date(p.creado_en) >= hace30).length;
  const contactados = propietarios.filter((p) => p.estado === "contactado").length;
  const altaPrioridad = propietarios.filter((p) => calcularPrioridad(p) === "alta").length;
  const sinSeguimiento = propietarios.filter((p) => {
    const dias = diasDesde(p.fecha_ultimo_contacto);
    return dias === null || dias >= 7;
  }).length;
  const exclusivas = propietarios.filter((p) => p.estado === "exclusiva_firmada" || p.estado === "captado").length;
  const perdidos = propietarios.filter((p) => p.estado === "perdido").length;

  const kpis = [
    { label: "Nuevos (30d)", value: nuevos, color: "text-sky-600" },
    { label: "Contactados", value: contactados, color: "text-cyan-600" },
    { label: "Alta prioridad", value: altaPrioridad, color: "text-red-600" },
    { label: "Sin seguimiento", value: sinSeguimiento, color: "text-amber-600" },
    { label: "Exclusivas", value: exclusivas, color: "text-emerald-600" },
    { label: "Perdidos", value: perdidos, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Captaciones</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/inmobiliaria/propietarios/nuevo"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Nueva captación
          </Link>
          <RefreshButton />
          <VistaSwitcher vista={vista} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-3 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Table / Kanban */}
      {propietarios.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium text-muted-foreground">Sin captaciones aún</p>
          <Link href="/inmobiliaria/propietarios/nuevo" className="mt-2 inline-block text-sm text-primary hover:underline">
            + Crear la primera captación
          </Link>
        </div>
      ) : vista === "tabla" ? (
        <TablaPropietarios propietarios={propietarios} agentes={agentes} agentesArray={agentesArray} tenantId={usuario.tenant_id} />
      ) : (
        <KanbanPropietarios propietarios={propietarios} agentes={agentes} agentesArray={agentesArray} tenantId={usuario.tenant_id} />
      )}
    </div>
  );
}
