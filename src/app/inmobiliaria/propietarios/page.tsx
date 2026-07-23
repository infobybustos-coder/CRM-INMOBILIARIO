import {
  UserPlus,
  Phone,
  Flame,
  AlertCircle,
  Award,
  XCircle,
} from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Filtros } from "@/components/asesor/propietarios/filtros";
import { VistaSwitcher } from "@/components/asesor/propietarios/vista-switcher";
import { Kanban } from "@/components/inmobiliaria/propietarios/kanban";
import { Tabla } from "@/components/inmobiliaria/propietarios/tabla";
import { NuevoPropietario } from "@/components/inmobiliaria/propietarios/nuevo-propietario";
import { calcularPrioridad } from "@/lib/prioridad";
import type { Propietario } from "@/app/asesor/propietarios/constantes";

type PropietarioConAgente = Propietario & { agente_id: string | null };

export default async function PropietariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await requireAdminInmobiliaria();
  const params = await searchParams;
  const vista = params.vista === "tabla" ? "tabla" : "kanban";

  const supabase = await createClient();
  let query = supabase
    .from("propietarios")
    .select(
      "id, nombre, telefono, email, whatsapp, direccion, tipo_inmueble, estado, valor_estimado, fecha_ultimo_contacto, fecha_proxima_accion, fuente_lead, guion_captacion, notas, creado_en, agente_id"
    )
    .eq("tenant_id", usuario.tenant_id);

  if (params.estado) query = query.eq("estado", params.estado);
  if (params.tipo_inmueble) query = query.eq("tipo_inmueble", params.tipo_inmueble);

  const [{ data }, { data: agentes }] = await Promise.all([
    query.order("creado_en", { ascending: false }),
    supabase
      .from("usuarios")
      .select("id, nombre_completo")
      .eq("tenant_id", usuario.tenant_id)
      .eq("activo", true),
  ]);

  const propietarios = (data ?? []) as PropietarioConAgente[];
  const agentesPorId = new Map((agentes ?? []).map((a) => [a.id, a.nombre_completo as string]));

  const kpis = [
    {
      label: "Nuevos",
      valor: propietarios.filter((p) => p.estado === "nuevo_lead").length,
      icono: UserPlus,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Contactados",
      valor: propietarios.filter((p) => p.estado === "contactado").length,
      icono: Phone,
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      label: "Alta prioridad",
      valor: propietarios.filter((p) => calcularPrioridad(p) === "alta").length,
      icono: Flame,
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      label: "Sin seguimiento",
      valor: propietarios.filter(
        (p) => !["captado", "perdido"].includes(p.estado) && !p.fecha_proxima_accion
      ).length,
      icono: AlertCircle,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Exclusivas",
      valor: propietarios.filter((p) => p.estado === "exclusiva_firmada").length,
      icono: Award,
      color: "bg-indigo-500/10 text-indigo-600",
    },
    {
      label: "Perdidos",
      valor: propietarios.filter((p) => p.estado === "perdido").length,
      icono: XCircle,
      color: "bg-rose-500/10 text-rose-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Propietarios</h1>
        <div className="flex items-center gap-2">
          <VistaSwitcher vista={vista} />
          <NuevoPropietario />
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

      {propietarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay propietarios registrados.</p>
      ) : vista === "tabla" ? (
        <Tabla propietarios={propietarios} agentesPorId={agentesPorId} />
      ) : (
        <Kanban propietarios={propietarios} agentesPorId={agentesPorId} />
      )}
    </div>
  );
}
