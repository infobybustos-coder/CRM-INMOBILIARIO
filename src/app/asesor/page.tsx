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

  const [
    propietariosProximos,
    compradoresProximos,
    propietariosNuevos,
    visitasHoy,
    exclusivas,
    inmueblesCaptados,
    tareasPendientes,
    totalPropietarios,
    captados,
    perdidos,
    estadosPropietarios,
    eventosAgenda,
    tareasAgenda,
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
      valor: tareasPendientes.count ?? 0,
      icono: CheckSquare,
      href: "/asesor/propietarios",
      color: "text-rose-500",
    },
  ];

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Vista General</h1>
        <p className="mt-1 text-muted-foreground">
          Hola, {usuario.nombre_completo?.split(" ")[0]}.
        </p>
      </div>

      <ResumenTareas items={agendaItems} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(({ label, valor, icono: Icono, href, color }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <Icono className={`size-5 ${color}`} />
            <span className="text-2xl font-semibold">{valor}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Próximas acciones</h2>
          {acciones.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No tienes acciones pendientes ni vencidas. ¡Vas al día!
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {acciones.map((a) => {
                const vencida = new Date(a.fecha_proxima_accion!) < new Date();
                return (
                  <li key={`${a.tipo}-${a.id}`}>
                    <Link
                      href={`/asesor/${a.tipo === "comprador" ? "compradores" : "propietarios"}`}
                      className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                    >
                      <span>
                        <span className="font-medium">{a.nombre}</span>
                        <span className="ml-2 text-muted-foreground">
                          {a.tipo === "comprador" ? "Comprador" : "Propietario"}
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
          <h2 className="text-lg font-medium">Agenda</h2>
          <div className="mt-3">
            <Link href="/asesor/agenda">
              <CalendarioMensual itemsPorDia={agendaPorDia} compacto />
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium">Captaciones por estado</h2>
        <div className="mt-3 space-y-2 rounded-lg border p-4">
          {ESTADOS_PROPIETARIO.map((estado) => (
            <div key={estado} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-xs text-muted-foreground">
                {ETIQUETAS_ESTADO[estado]}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${COLOR_BARRA_ESTADO[estado]}`}
                  style={{ width: `${(conteoPorEstado[estado] / maxEstado) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-medium">
                {conteoPorEstado[estado]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium">Estadísticas</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-sky-500/10 p-4">
            <p className="text-2xl font-semibold text-sky-600">{totalCaptaciones}</p>
            <p className="text-sm text-muted-foreground">Captaciones</p>
          </div>
          <div className="rounded-lg border bg-indigo-500/10 p-4">
            <p className="text-2xl font-semibold text-indigo-600">{exclusivas.count ?? 0}</p>
            <p className="text-sm text-muted-foreground">Exclusivas</p>
          </div>
          <div className="rounded-lg border bg-rose-500/10 p-4">
            <p className="text-2xl font-semibold text-rose-600">{perdidos.count ?? 0}</p>
            <p className="text-sm text-muted-foreground">Perdidos</p>
          </div>
          <div className="rounded-lg border bg-emerald-500/10 p-4">
            <p className="text-2xl font-semibold text-emerald-600">{conversion}%</p>
            <p className="text-sm text-muted-foreground">Conversión</p>
          </div>
        </div>
      </div>
    </div>
  );
}
