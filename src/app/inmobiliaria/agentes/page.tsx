import { Users, CheckCircle2, AlertTriangle, UserPlus, Home, Award } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabla } from "@/components/inmobiliaria/agentes/tabla";
import type { AgenteFila } from "./constantes";

function inicioDeMes(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

export default async function AgentesPage() {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();

  const ahora = new Date();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const inicioMes = inicioDeMes(ahora);

  const [
    { data: agentes, error: errorAgentes },
    { data: propietarios },
    { data: compradores },
    { data: tareas },
    { data: actividades },
    { count: captacionesEquipo },
    { count: exclusivasEquipo },
  ] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id, nombre_completo, email, activo, creado_en")
      .eq("tenant_id", usuario.tenant_id)
      .eq("rol", "empleado")
      .order("nombre_completo"),
    supabase
      .from("propietarios")
      .select("id, agente_id")
      .eq("tenant_id", usuario.tenant_id)
      .not("estado", "in", "(captado,perdido)"),
    supabase
      .from("compradores")
      .select("id, agente_id")
      .eq("tenant_id", usuario.tenant_id)
      .not("estado", "in", "(comprado,perdido)"),
    supabase
      .from("tareas")
      .select("id, asignado_a")
      .eq("tenant_id", usuario.tenant_id)
      .in("estado", ["pendiente", "en_progreso"]),
    supabase
      .from("actividades")
      .select("usuario_id, creado_en")
      .eq("tenant_id", usuario.tenant_id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("estado", "captado"),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("estado", "exclusiva_firmada"),
  ]);

  const propietariosPorAgente = new Map<string, number>();
  for (const p of propietarios ?? []) {
    if (!p.agente_id) continue;
    propietariosPorAgente.set(p.agente_id, (propietariosPorAgente.get(p.agente_id) ?? 0) + 1);
  }

  const compradoresPorAgente = new Map<string, number>();
  for (const c of compradores ?? []) {
    if (!c.agente_id) continue;
    compradoresPorAgente.set(c.agente_id, (compradoresPorAgente.get(c.agente_id) ?? 0) + 1);
  }

  const tareasPorAgente = new Map<string, number>();
  for (const t of tareas ?? []) {
    if (!t.asignado_a) continue;
    tareasPorAgente.set(t.asignado_a, (tareasPorAgente.get(t.asignado_a) ?? 0) + 1);
  }

  const ultimaActividadPorAgente = new Map<string, string>();
  for (const a of actividades ?? []) {
    if (!a.usuario_id) continue;
    if (!ultimaActividadPorAgente.has(a.usuario_id)) {
      ultimaActividadPorAgente.set(a.usuario_id, a.creado_en);
    }
  }

  const idsActivosHoy = new Set(
    (actividades ?? [])
      .filter((a) => a.usuario_id && new Date(a.creado_en) >= inicioHoy && new Date(a.creado_en) <= finHoy)
      .map((a) => a.usuario_id as string)
  );

  const filas: AgenteFila[] = (agentes ?? []).map((a) => ({
    id: a.id,
    nombreCompleto: a.nombre_completo,
    email: a.email,
    activoHoy: idsActivosHoy.has(a.id),
    totalPropietarios: propietariosPorAgente.get(a.id) ?? 0,
    totalCompradores: compradoresPorAgente.get(a.id) ?? 0,
    tareasPendientes: tareasPorAgente.get(a.id) ?? 0,
    ultimaActividad: ultimaActividadPorAgente.get(a.id) ?? null,
  }));

  const activos = (agentes ?? []).filter((a) => a.activo);

  const kpis = [
    {
      label: "Total de asesores",
      valor: activos.length,
      icono: Users,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Activos hoy",
      valor: activos.filter((a) => idsActivosHoy.has(a.id)).length,
      icono: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Sin actividad",
      valor: activos.filter((a) => !idsActivosHoy.has(a.id)).length,
      icono: AlertTriangle,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Nuevos este mes",
      valor: (agentes ?? []).filter((a) => new Date(a.creado_en) >= inicioMes).length,
      icono: UserPlus,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Captaciones del equipo",
      valor: captacionesEquipo ?? 0,
      icono: Home,
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      label: "Exclusivas del equipo",
      valor: exclusivasEquipo ?? 0,
      icono: Award,
      color: "bg-rose-500/10 text-rose-600",
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Agentes</h1>

      {errorAgentes && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
          <p className="font-medium">No se pudieron cargar los asesores.</p>
          <p className="mt-1 text-xs">{errorAgentes.message}</p>
        </div>
      )}

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

      <Tabla agentes={filas} />
    </div>
  );
}
