import { UserPlus, Users, Flame, CalendarCheck, Award, XCircle } from "lucide-react";
import { requireInmobiliariaEfectivo } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Filtros } from "@/components/asesor/compradores/filtros";
import { VistaSwitcher } from "@/components/asesor/propietarios/vista-switcher";
import { Kanban } from "@/components/inmobiliaria/compradores/kanban";
import { Tabla } from "@/components/inmobiliaria/compradores/tabla";
import { NuevoComprador } from "@/components/inmobiliaria/compradores/nuevo-comprador";
import { calcularPrioridadComprador } from "@/lib/prioridad";
import type { Comprador } from "@/app/asesor/compradores/constantes";

type CompradorConAgente = Comprador & { agente_id: string | null };

export default async function MisCompradoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await requireInmobiliariaEfectivo();
  const params = await searchParams;
  const vista = params.vista === "tabla" ? "tabla" : "kanban";

  const supabase = await createClient();
  let query = supabase
    .from("compradores")
    .select(
      "id, nombre, telefono, email, presupuesto_min, presupuesto_max, financiacion, tipo_inmueble, zona_buscada_id, habitaciones, urgencia, estado, fecha_ultimo_contacto, fecha_proxima_accion, notas, creado_en, agente_id"
    )
    .eq("tenant_id", usuario.tenant_id)
    .eq("agente_id", usuario.id);

  if (params.estado) query = query.eq("estado", params.estado);
  if (params.tipo_inmueble) query = query.eq("tipo_inmueble", params.tipo_inmueble);
  if (params.presupuesto_min) query = query.gte("presupuesto_max", Number(params.presupuesto_min));
  if (params.presupuesto_max) query = query.lte("presupuesto_min", Number(params.presupuesto_max));

  const [{ data }, { data: zonas }] = await Promise.all([
    query.order("creado_en", { ascending: false }),
    supabase.from("zonas").select("id, nombre").eq("tenant_id", usuario.tenant_id),
  ]);

  const compradores = (data ?? []) as CompradorConAgente[];
  const agentesPorId = new Map([[usuario.id, usuario.nombre_completo as string]]);
  const zonasPorId = new Map((zonas ?? []).map((z) => [z.id, z.nombre as string]));

  const kpis = [
    {
      label: "Nuevos",
      valor: compradores.filter((c) => c.estado === "nuevo").length,
      icono: UserPlus,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Activos",
      valor: compradores.filter((c) => !["comprado", "perdido"].includes(c.estado)).length,
      icono: Users,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Alta prioridad",
      valor: compradores.filter((c) => calcularPrioridadComprador(c) === "alta").length,
      icono: Flame,
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      label: "Con visitas",
      valor: compradores.filter((c) => c.estado === "visitas").length,
      icono: CalendarCheck,
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      label: "Comprados",
      valor: compradores.filter((c) => c.estado === "comprado").length,
      icono: Award,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Perdidos",
      valor: compradores.filter((c) => c.estado === "perdido").length,
      icono: XCircle,
      color: "bg-rose-500/10 text-rose-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis compradores</h1>
        <div className="flex items-center gap-2">
          <VistaSwitcher vista={vista} />
          <NuevoComprador />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {kpis.map(({ label, valor, icono: Icono, color }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border p-3">
            <span className={`flex size-8 items-center justify-center rounded-lg ${color}`}>
              <Icono className="size-4" />
            </span>
            <span className="text-xl font-semibold">{valor}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <Filtros />

      {compradores.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no tienes compradores asignados.</p>
      ) : vista === "tabla" ? (
        <Tabla compradores={compradores} agentesPorId={agentesPorId} zonasPorId={zonasPorId} />
      ) : (
        <Kanban compradores={compradores} agentesPorId={agentesPorId} zonasPorId={zonasPorId} />
      )}
    </div>
  );
}
