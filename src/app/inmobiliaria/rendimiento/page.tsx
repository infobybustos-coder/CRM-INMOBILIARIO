import Link from "next/link";
import { Home, Award, Phone, CalendarClock, CheckCheck, Activity, X } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PeriodoSwitcher } from "@/components/inmobiliaria/rendimiento/periodo-switcher";
import { VistaSwitcher } from "@/components/inmobiliaria/rendimiento/vista-switcher";
import { Tabla } from "@/components/inmobiliaria/rendimiento/tabla";
import { Grafico } from "@/components/inmobiliaria/rendimiento/grafico";
import type { RendimientoFila } from "./constantes";

function inicioDeSemana(fecha: Date) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay();
  const diff = (dia + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function inicioDeMes(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

export default async function RendimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; periodo?: string; agente?: string }>;
}) {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();
  const { vista: vistaParam, periodo: periodoParam, agente: agenteFiltro } = await searchParams;

  const vista = vistaParam === "grafico" ? "grafico" : "tabla";
  const periodo = periodoParam === "hoy" || periodoParam === "mes" ? periodoParam : "semana";

  const ahora = new Date();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const inicioPeriodo =
    periodo === "hoy" ? inicioHoy : periodo === "mes" ? inicioDeMes(ahora) : inicioDeSemana(ahora);

  const [{ data: agentes }, { data: propietarios }, { data: actividadesSeguimiento }, { data: visitas }, { data: tareas }, { data: actividadHoy }] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select("id, nombre_completo")
        .eq("tenant_id", usuario.tenant_id)
        .eq("rol", "empleado")
        .eq("activo", true)
        .order("nombre_completo"),
      supabase
        .from("propietarios")
        .select("agente_id, estado")
        .eq("tenant_id", usuario.tenant_id)
        .in("estado", ["captado", "exclusiva_firmada"])
        .gte("actualizado_en", inicioPeriodo.toISOString()),
      supabase
        .from("actividades")
        .select("usuario_id")
        .eq("tenant_id", usuario.tenant_id)
        .in("tipo", ["llamada", "email", "whatsapp", "nota", "visita", "tasacion"])
        .gte("creado_en", inicioPeriodo.toISOString()),
      supabase
        .from("eventos_agenda")
        .select("usuario_id")
        .eq("tenant_id", usuario.tenant_id)
        .eq("tipo", "visita")
        .eq("estado", "completado")
        .gte("fecha_hora", inicioPeriodo.toISOString()),
      supabase
        .from("tareas")
        .select("asignado_a")
        .eq("tenant_id", usuario.tenant_id)
        .eq("estado", "completada")
        .gte("completada_en", inicioPeriodo.toISOString()),
      supabase
        .from("actividades")
        .select("usuario_id")
        .eq("tenant_id", usuario.tenant_id)
        .gte("creado_en", inicioHoy.toISOString()),
    ]);

  function contarPor<T extends Record<string, unknown>>(filas: T[], clave: keyof T, filtro?: (v: string) => boolean) {
    const mapa = new Map<string, number>();
    for (const f of filas) {
      const id = f[clave] as string | null;
      if (!id) continue;
      if (filtro && !filtro(id)) continue;
      mapa.set(id, (mapa.get(id) ?? 0) + 1);
    }
    return mapa;
  }

  const captacionesPorAgente = contarPor(
    (propietarios ?? []).filter((p) => p.estado === "captado"),
    "agente_id"
  );
  const exclusivasPorAgente = contarPor(
    (propietarios ?? []).filter((p) => p.estado === "exclusiva_firmada"),
    "agente_id"
  );
  const seguimientosPorAgente = contarPor(actividadesSeguimiento ?? [], "usuario_id");
  const visitasPorAgente = contarPor(visitas ?? [], "usuario_id");
  const tareasPorAgente = contarPor(tareas ?? [], "asignado_a");
  const actividadHoyPorAgente = contarPor(actividadHoy ?? [], "usuario_id");

  let filas: RendimientoFila[] = (agentes ?? []).map((a) => ({
    agenteId: a.id,
    nombreCompleto: a.nombre_completo,
    captaciones: captacionesPorAgente.get(a.id) ?? 0,
    exclusivas: exclusivasPorAgente.get(a.id) ?? 0,
    seguimientos: seguimientosPorAgente.get(a.id) ?? 0,
    visitas: visitasPorAgente.get(a.id) ?? 0,
    tareas: tareasPorAgente.get(a.id) ?? 0,
    actividadHoy: actividadHoyPorAgente.get(a.id) ?? 0,
  }));

  if (agenteFiltro) {
    filas = filas.filter((f) => f.agenteId === agenteFiltro);
  }

  const kpis = [
    {
      label: "Captaciones",
      valor: filas.reduce((sum, f) => sum + f.captaciones, 0),
      icono: Home,
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      label: "Exclusivas",
      valor: filas.reduce((sum, f) => sum + f.exclusivas, 0),
      icono: Award,
      color: "bg-rose-500/10 text-rose-600",
    },
    {
      label: "Seguimientos",
      valor: filas.reduce((sum, f) => sum + f.seguimientos, 0),
      icono: Phone,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Visitas",
      valor: filas.reduce((sum, f) => sum + f.visitas, 0),
      icono: CalendarClock,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Tareas",
      valor: filas.reduce((sum, f) => sum + f.tareas, 0),
      icono: CheckCheck,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Actividad del día",
      valor: filas.reduce((sum, f) => sum + f.actividadHoy, 0),
      icono: Activity,
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  const agenteFiltrado = agenteFiltro ? (agentes ?? []).find((a) => a.id === agenteFiltro) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Rendimiento</h1>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodoSwitcher periodo={periodo} />
          <VistaSwitcher vista={vista} />
        </div>
      </div>

      {agenteFiltrado && (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <span>
            Mostrando solo a <span className="font-medium">{agenteFiltrado.nombre_completo}</span>
          </span>
          <Link
            href="/inmobiliaria/rendimiento"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" /> Ver todos
          </Link>
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

      {vista === "grafico" ? <Grafico filas={filas} /> : <Tabla filas={filas} />}
    </div>
  );
}
