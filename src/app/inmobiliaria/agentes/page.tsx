import Link from "next/link";
import { Users, AlertTriangle, UserPlus, Home, Award } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabla } from "@/components/inmobiliaria/agentes/tabla";
import { NuevoMiembro } from "@/components/inmobiliaria/equipo/nuevo-miembro";
import { limiteEmpleados } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import type { AgenteFila } from "./constantes";

const MEDALLAS = ["🥇", "🥈", "🥉"];

function inicioDeMes(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

function contarPorId(filas: { id: string | null }[]) {
  const mapa = new Map<string, number>();
  for (const f of filas) {
    if (!f.id) continue;
    mapa.set(f.id, (mapa.get(f.id) ?? 0) + 1);
  }
  return mapa;
}

export default async function AgentesPage() {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();
  const config = await obtenerConfigPlanes();

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
    { data: captacionesMes },
    { data: exclusivasMes },
    { data: seguimientosMes },
    { data: visitasMes },
    { data: tareasCompletadasMes },
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
    supabase
      .from("propietarios")
      .select("agente_id")
      .eq("tenant_id", usuario.tenant_id)
      .eq("estado", "captado")
      .gte("actualizado_en", inicioMes.toISOString()),
    supabase
      .from("propietarios")
      .select("agente_id")
      .eq("tenant_id", usuario.tenant_id)
      .eq("estado", "exclusiva_firmada")
      .gte("actualizado_en", inicioMes.toISOString()),
    supabase
      .from("actividades")
      .select("usuario_id")
      .eq("tenant_id", usuario.tenant_id)
      .in("tipo", ["llamada", "email", "whatsapp", "nota", "visita", "tasacion"])
      .gte("creado_en", inicioMes.toISOString()),
    supabase
      .from("eventos_agenda")
      .select("usuario_id")
      .eq("tenant_id", usuario.tenant_id)
      .eq("tipo", "visita")
      .eq("estado", "completado")
      .gte("fecha_hora", inicioMes.toISOString()),
    supabase
      .from("tareas")
      .select("asignado_a")
      .eq("tenant_id", usuario.tenant_id)
      .eq("estado", "completada")
      .gte("completada_en", inicioMes.toISOString()),
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
  const activosHoyCount = activos.filter((a) => idsActivosHoy.has(a.id)).length;
  const sinActividadCount = activos.length - activosHoyCount;
  const pctActivosHoy = activos.length > 0 ? (activosHoyCount / activos.length) * 100 : 0;
  const limiteAgentes = limiteEmpleados(config, usuario.tenant ?? {});

  const kpis = [
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

  const captacionesMesPorAgente = contarPorId((captacionesMes ?? []).map((p) => ({ id: p.agente_id })));
  const exclusivasMesPorAgente = contarPorId((exclusivasMes ?? []).map((p) => ({ id: p.agente_id })));
  const seguimientosPorAgente = contarPorId((seguimientosMes ?? []).map((a) => ({ id: a.usuario_id })));
  const visitasPorAgente = contarPorId((visitasMes ?? []).map((v) => ({ id: v.usuario_id })));
  const tareasCompletadasPorAgente = contarPorId(
    (tareasCompletadasMes ?? []).map((t) => ({ id: t.asignado_a }))
  );
  const actividadHoyPorAgente = contarPorId(
    (actividades ?? [])
      .filter((a) => a.usuario_id && new Date(a.creado_en) >= inicioHoy && new Date(a.creado_en) <= finHoy)
      .map((a) => ({ id: a.usuario_id }))
  );

  const ranking = (agentes ?? [])
    .map((a) => {
      const puntuacion =
        (captacionesMesPorAgente.get(a.id) ?? 0) +
        (exclusivasMesPorAgente.get(a.id) ?? 0) +
        (seguimientosPorAgente.get(a.id) ?? 0) +
        (visitasPorAgente.get(a.id) ?? 0) +
        (tareasCompletadasPorAgente.get(a.id) ?? 0) +
        (actividadHoyPorAgente.get(a.id) ?? 0);
      return { id: a.id, nombreCompleto: a.nombre_completo, puntuacion };
    })
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agentes</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activos.length} de {limiteAgentes} agentes incluidos en tu plan
          </p>
        </div>
        <NuevoMiembro rol="empleado" etiqueta="agente" />
      </div>

      {errorAgentes && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
          <p className="font-medium">No se pudieron cargar los asesores.</p>
          <p className="mt-1 text-xs">{errorAgentes.message}</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <Users className="size-4 text-muted-foreground" /> Actividad del equipo
          </h2>
          <div className="mt-3 flex items-center gap-4">
            <div
              className="flex size-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#10b981 ${pctActivosHoy * 3.6}deg, rgb(120 113 108 / 0.15) 0deg)`,
              }}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-background text-xs font-semibold">
                {activosHoyCount}/{activos.length}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold text-emerald-600">{activosHoyCount}</span>{" "}
                <span className="text-muted-foreground">Activos hoy</span>
              </p>
              <p className="flex items-center gap-1">
                <AlertTriangle className="size-3.5 text-amber-500" />
                <span className="font-semibold">{sinActividadCount}</span>{" "}
                <span className="text-muted-foreground">Sin actividad</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:col-span-2">
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
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabla agentes={filas} />
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <Award className="size-4 text-amber-500" /> Top 10 mejores empleados
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Captaciones + exclusivas + seguimientos + visitas + tareas completadas + actividad de hoy, este mes.
          </p>
          {ranking.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Todavía no hay actividad este mes.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {ranking.map((r, i) => (
                <li key={r.id}>
                  <Link
                    href={`/inmobiliaria/agentes/${r.id}`}
                    className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm hover:bg-accent"
                  >
                    <span>
                      {MEDALLAS[i] ?? `${i + 1}º`} {r.nombreCompleto}
                    </span>
                    <span className="font-semibold">{r.puntuacion}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
