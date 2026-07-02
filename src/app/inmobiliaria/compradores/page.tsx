import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VistaSwitcher } from "@/components/asesor/propietarios/vista-switcher";
import { TablaCompradores } from "@/components/inmobiliaria/compradores/tabla-compradores";
import { KanbanCompradores } from "@/components/inmobiliaria/compradores/kanban-compradores";
import { calcularPrioridadComprador } from "@/lib/prioridad";

const BASE = "/inmobiliaria/compradores";

export default async function InmobiliariaCompradoresPage({
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
    .from("compradores")
    .select(
      "id, nombre, telefono, email, presupuesto_min, presupuesto_max, financiacion, tipo_inmueble, zona_buscada_id, habitaciones, urgencia, estado, fecha_ultimo_contacto, fecha_proxima_accion, notas, creado_en, agente_id"
    );

  if (!gestor) query = query.eq("agente_id", usuario.id);
  if (params.estado) query = query.eq("estado", params.estado);

  const [{ data }, { data: usuariosData }, { data: zonasData }] = await Promise.all([
    query.order("creado_en", { ascending: false }),
    supabase.from("usuarios").select("id, nombre_completo").eq("tenant_id", usuario.tenant_id).eq("activo", true),
    supabase.from("zonas").select("id, nombre").eq("tenant_id", usuario.tenant_id),
  ]);

  const compradores = data ?? [];
  const agentes: Record<string, string> = Object.fromEntries(
    (usuariosData ?? []).map((u) => [u.id, u.nombre_completo])
  );
  const zonas: Record<string, string> = Object.fromEntries(
    (zonasData ?? []).map((z) => [z.id, z.nombre])
  );

  // KPIs
  const hace30 = new Date(Date.now() - 30 * 86400000);
  const nuevos = compradores.filter((c) => new Date(c.creado_en) >= hace30).length;
  const activos = compradores.filter((c) => ["cualificado", "busqueda_activa", "visitas", "oferta"].includes(c.estado)).length;
  const altaPrioridad = compradores.filter((c) => calcularPrioridadComprador(c) === "alta").length;
  const conVisitas = compradores.filter((c) => c.estado === "visitas").length;
  const comprados = compradores.filter((c) => c.estado === "comprado").length;
  const perdidos = compradores.filter((c) => c.estado === "perdido").length;

  const kpis = [
    { label: "Nuevos (30d)", value: nuevos, color: "text-sky-600" },
    { label: "Activos", value: activos, color: "text-emerald-600" },
    { label: "Alta prioridad", value: altaPrioridad, color: "text-red-600" },
    { label: "Con visitas", value: conVisitas, color: "text-violet-600" },
    { label: "Comprados", value: comprados, color: "text-primary" },
    { label: "Perdidos", value: perdidos, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Compradores</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/inmobiliaria/compradores/nuevo"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Nuevo comprador
          </Link>
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

      {compradores.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium text-muted-foreground">Sin compradores aún</p>
          <Link href="/inmobiliaria/compradores/nuevo" className="mt-2 inline-block text-sm text-primary hover:underline">
            + Crear el primer comprador
          </Link>
        </div>
      ) : vista === "tabla" ? (
        <TablaCompradores compradores={compradores} agentes={agentes} zonas={zonas} basePath={BASE} />
      ) : (
        <KanbanCompradores compradores={compradores} agentes={agentes} zonas={zonas} basePath={BASE} />
      )}
    </div>
  );
}
