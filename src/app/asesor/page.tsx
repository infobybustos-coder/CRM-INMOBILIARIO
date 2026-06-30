import Link from "next/link";
import { redirect } from "next/navigation";
import {
  UserPlus,
  Clock,
  CalendarCheck,
  Award,
  Building2,
  CheckSquare,
} from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarioMensual } from "@/components/asesor/calendario-mensual";
import { ResumenTareas } from "@/components/asesor/resumen-tareas";
import { GraficoLineas } from "@/components/asesor/grafico-lineas";
import { agruparPorDia, type AgendaItem } from "@/lib/agenda";
import { ESTADOS_PROPIETARIO, ETIQUETAS_ESTADO } from "./propietarios/constantes";

const COLOR_BARRA_ESTADO: Record<string, string> = {
  nuevo_lead: "bg-sky-500",
  contactado: "bg-cyan-500",
  tasacion_programada: "bg-amber-500",
  tasacion_realizada: "bg-orange-500",
  negociacion: "bg-violet-500",
  exclusiva_firmada: "bg-indigo-500",
  captado: "bg-emerald-500",
  perdido: "bg-rose-500",
};

export default async function AsesorDashboard() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const ahora = new Date().toISOString();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const inicioHistorico = new Date();
  inicioHistorico.setDate(inicioHistorico.getDate() - 7 * 8);
  inicioHistorico.setHours(0, 0, 0, 0);

  const [
    propietariosProximos,
    compradoresProximos,
    propietariosNuevos,
    visitasHoy,
    exclusivas,
    inmueblesCaptados,
    tareasPendientes,
    eventosPendientes,
    totalPropietarios,
    captados,
    perdidos,
    estadosPropietarios,
    eventosAgenda,
    tareasAgenda,
    propietariosHistorico,
    tareasCompletadasHistorico,
  ] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id, nombre, fecha_proxima_accion")
      .eq("agente_id", usuario.id)
      .not("fecha_proxima_accion", "is", null)
      .lte("fecha_proxima_accion", ahora)
      .order("fecha_proxima_accion")
      .limit(10),
    supabase
      .from("compradores")
      .select("id, nombre, fecha_proxima_accion")
      .eq("agente_id", usuario.id)
      .not("fecha_proxima_accion", "is", null)
      .lte("fecha_proxima_accion", ahora)
      .order("fecha_proxima_accion")
      .limit(10),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .eq("estado", "nuevo_lead"),
    supabase
      .from("eventos_agenda")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuario.id)
      .eq("tipo", "visita")
      .gte("fecha_hora", inicioHoy.toISOString())
      .lte("fecha_hora", finHoy.toISOString()),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .eq("estado", "exclusiva_firmada"),
    supabase
      .from("inmuebles")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id),
    supabase
      .from("tareas")
      .select("id", { count: "exact", head: true })
      .eq("asignado_a", usuario.id)
      .eq("estado", "pendiente"),
    supabase
      .from("eventos_agenda")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuario.id)
      .eq("estado", "pendiente"),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .eq("estado", "captado"),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .eq("estado", "perdido"),
    supabase.from("propietarios").select("estado").eq("agente_id", usuario.id),
    supabase
      .from("eventos_agenda")
      .select("id, tipo, titulo, fecha_hora, estado")
      .eq("usuario_id", usuario.id),
    supabase
      .from("tareas")
      .select("id, titulo, fecha_vencimiento, estado")
      .eq("asignado_a", usuario.id)
      .not("fecha_vencimiento", "is", null),
    supabase
      .from("propietarios")
      .select("creado_en, estado")
      .eq("agente_id", usuario.id)
      .gte("creado_en", inicioHistorico.toISOString()),
    supabase
      .from("tareas")
      .select("completada_en")
      .eq("asignado_a", usuario.id)
      .not("completada_en", "is", null)
      .gte("completada_en", inicioHistorico.toISOString()),
  ]);

  const totalCaptaciones = totalPropietarios.count ?? 0;
  const conversion =
    totalCaptaciones > 0
      ? Math.round(((captados.count ?? 0) / totalCaptaciones) * 100)
      : 0;

  const conteoPorEstado = ESTADOS_PROPIETARIO.reduce<Record<string, number>>((acc, estado) => {
    acc[estado] = 0;
    return acc;
  }, {});
  for (const p of estadosPropietarios.data ?? []) {
    if (p.estado in conteoPorEstado) conteoPorEstado[p.estado] += 1;
  }
  const maxEstado = Math.max(1, ...Object.values(conteoPorEstado));

  const agendaItems: AgendaItem[] = [
    ...(eventosAgenda.data ?? []).map((e) => ({
      id: e.id,
      origen: "evento" as const,
      titulo: e.titulo,
      fecha: e.fecha_hora,
      estado: e.estado,
      tipo: e.tipo,
    })),
    ...(tareasAgenda.data ?? []).map((t) => ({
      id: t.id,
      origen: "tarea" as const,
      titulo: t.titulo,
      fecha: t.fecha_vencimiento as string,
      estado: t.estado,
    })),
  ];
  const agendaPorDia = agruparPorDia(agendaItems);

  const stats = [
    {
      label: "Propietarios nuevos",
      valor: propietariosNuevos.count ?? 0,
      icono: UserPlus,
      href: "/asesor/propietarios",
      color: "text-sky-500",
    },
    {
      label: "Seguimientos pendientes",
      valor: (propietariosProximos.data?.length ?? 0) + (compradoresProximos.data?.length ?? 0),
      icono: Clock,
      href: "/asesor/propietarios",
      color: "text-amber-500",
    },
    {
      label: "Visitas del día",
      valor: visitasHoy.count ?? 0,
      icono: CalendarCheck,
      href: "/asesor/agenda",
      color: "text-orange-500",
    },
    {
      label: "Exclusivas conseguidas",
      valor: exclusivas.count ?? 0,
      icono: Award,
      href: "/asesor/propietarios",
      color: "text-emerald-500",
    },
    {
      label: "Inmuebles captados",
      valor: inmueblesCaptados.count ?? 0,
      icono: Building2,
      href: "/asesor/inmuebles",
      color: "text-violet-500",
    },
    {
      label: "Tareas pendientes",
      valor: (tareasPendientes.count ?? 0) + (eventosPendientes.count ?? 0),
      icono: CheckSquare,
      href: "/asesor/tareas",
      color: "text-rose-500",
    },
  ];

  function inicioDeSemana(fecha: Date) {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    const dia = d.getDay();
    const diff = (dia + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }

  const semanas: Date[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = inicioDeSemana(new Date());
    d.setDate(d.getDate() - i * 7);
    semanas.push(d);
  }

  function indiceSemana(fecha: string) {
    const inicio = inicioDeSemana(new Date(fecha)).getTime();
    return semanas.findIndex((s) => s.getTime() === inicio);
  }

  const captacionesPorSemana = new Array(semanas.length).fill(0);
  const captadosPorSemana = new Array(semanas.length).fill(0);
  for (const p of propietariosHistorico.data ?? []) {
    const i = indiceSemana(p.creado_en);
    if (i >= 0) {
      captacionesPorSemana[i] += 1;
      if (p.estado === "captado") captadosPorSemana[i] += 1;
    }
  }

  const tareasPorSemana = new Array(semanas.length).fill(0);
  for (const t of tareasCompletadasHistorico.data ?? []) {
    const i = indiceSemana(t.completada_en as string);
    if (i >= 0) tareasPorSemana[i] += 1;
  }

  const etiquetasSemanas = semanas.map((s) =>
    s.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })
  );

  const acciones = [
    ...(propietariosProximos.data ?? []).map((p) => ({
      ...p,
      tipo: "propietario" as const,
    })),
    ...(compradoresProximos.data ?? []).map((c) => ({
      ...c,
      tipo: "comprador" as const,
    })),
  ].sort(
    (a, b) =>
      new Date(a.fecha_proxima_accion!).getTime() -
      new Date(b.fecha_proxima_accion!).getTime()
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Vista General</h1>
        <p className="mt-1 text-muted-foreground">
          Hola, {usuario.nombre_completo?.split(" ")[0]}.
        </p>
      </div>

      <ResumenTareas items={agendaItems} />

      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {stats.map(({ label, valor, icono: Icono, href, color }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-accent"
          >
            <Icono className={`size-4 ${color}`} />
            <span className="text-xl font-semibold">{valor}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3 md:col-span-2">
          <h2 className="text-sm font-medium">Próximas acciones</h2>
          {acciones.length === 0 ? (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                No tienes acciones pendientes ni vencidas. ¡Vas al día!
              </p>
              <div className="mt-3">
                <GraficoLineas
                  etiquetas={etiquetasSemanas}
                  series={[
                    { nombre: "Captaciones nuevas", color: "#0ea5e9", valores: captacionesPorSemana },
                    { nombre: "Captados", color: "#10b981", valores: captadosPorSemana },
                    { nombre: "Tareas completadas", color: "#a855f7", valores: tareasPorSemana },
                  ]}
                  alto={90}
                  grosorLinea={1.25}
                />
              </div>
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {acciones.slice(0, 6).map((a) => {
                const vencida = new Date(a.fecha_proxima_accion!) < new Date();
                return (
                  <li key={`${a.tipo}-${a.id}`}>
                    <Link
                      href={`/asesor/${a.tipo === "comprador" ? "compradores" : "propietarios"}`}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs"
                    >
                      <span>
                        <span className="font-medium">{a.nombre}</span>
                        <span className="ml-2 text-muted-foreground">
                          {a.tipo === "comprador" ? "Comprador" : "Captación"}
                        </span>
                      </span>
                      <span
                        className={vencida ? "text-destructive" : "text-muted-foreground"}
                      >
                        {new Date(a.fecha_proxima_accion!).toLocaleDateString("es-ES")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <Link href="/asesor/agenda" className="block">
            <CalendarioMensual itemsPorDia={agendaPorDia} compacto />
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3 md:col-span-2">
          <h2 className="text-sm font-medium">Captaciones por estado</h2>
          <div className="mt-2 space-y-1.5">
            {ESTADOS_PROPIETARIO.map((estado) => (
              <div key={estado} className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-xs text-muted-foreground">
                  {ETIQUETAS_ESTADO[estado]}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${COLOR_BARRA_ESTADO[estado]}`}
                    style={{ width: `${(conteoPorEstado[estado] / maxEstado) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right text-xs font-medium">
                  {conteoPorEstado[estado]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border p-3">
          <h2 className="self-start text-sm font-medium">Conversión</h2>
          <div
            className="flex size-24 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#10b981 ${conversion * 3.6}deg, rgb(120 113 108 / 0.15) 0deg)`,
            }}
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-background text-sm font-semibold">
              {conversion}%
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {captados.count ?? 0} de {totalCaptaciones} captaciones cerradas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-lg border bg-sky-500/10 p-3">
          <p className="text-xl font-semibold text-sky-600">{totalCaptaciones}</p>
          <p className="text-xs text-muted-foreground">Captaciones</p>
        </div>
        <div className="rounded-lg border bg-indigo-500/10 p-3">
          <p className="text-xl font-semibold text-indigo-600">{exclusivas.count ?? 0}</p>
          <p className="text-xs text-muted-foreground">Exclusivas</p>
        </div>
        <div className="rounded-lg border bg-rose-500/10 p-3">
          <p className="text-xl font-semibold text-rose-600">{perdidos.count ?? 0}</p>
          <p className="text-xs text-muted-foreground">Perdidos</p>
        </div>
        <div className="rounded-lg border bg-emerald-500/10 p-3">
          <p className="text-xl font-semibold text-emerald-600">{conversion}%</p>
          <p className="text-xs text-muted-foreground">Conversión</p>
        </div>
      </div>
    </div>
  );
}
