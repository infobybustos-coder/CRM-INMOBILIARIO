import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Building2, ShoppingCart, CalendarCheck, CheckSquare, Award } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarioMensual } from "@/components/asesor/calendario-mensual";
import { claveDia, agruparPorDia, type AgendaItem } from "@/lib/agenda";

const EMOJI_TIPO_EVENTO: Record<string, string> = {
  llamada: "📞",
  visita: "🏡",
  tasacion: "📋",
  reunion: "🤝",
  recordatorio: "🔔",
};

function BarraProgreso({ label, actual, objetivo }: { label: string; actual: number; objetivo: number }) {
  const pct = Math.min(100, Math.round((actual / Math.max(1, objetivo)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">
          {actual} / {objetivo}
        </p>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function AsesorDashboard() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const ahora = new Date();
  const ahoraISO = ahora.toISOString();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    propietariosProximos,
    compradoresProximos,
    propietariosActivos,
    compradoresActivos,
    visitasHoy,
    exclusivas,
    inmueblesTotal,
    tareasPendientes,
    eventosAgenda,
    tareasAgenda,
    captacionesMes,
    exclusivasMes,
  ] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id, nombre, fecha_proxima_accion")
      .eq("agente_id", usuario.id)
      .not("fecha_proxima_accion", "is", null)
      .lte("fecha_proxima_accion", ahoraISO)
      .order("fecha_proxima_accion")
      .limit(10),
    supabase
      .from("compradores")
      .select("id, nombre, fecha_proxima_accion")
      .eq("agente_id", usuario.id)
      .not("fecha_proxima_accion", "is", null)
      .lte("fecha_proxima_accion", ahoraISO)
      .order("fecha_proxima_accion")
      .limit(10),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .not("estado", "in", "(captado,perdido)"),
    supabase
      .from("compradores")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .not("estado", "in", "(comprado,perdido)"),
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
      .select("id, tipo, titulo, fecha_hora, estado, confirmado")
      .eq("usuario_id", usuario.id),
    supabase
      .from("tareas")
      .select("id, titulo, fecha_vencimiento, estado")
      .eq("asignado_a", usuario.id)
      .not("fecha_vencimiento", "is", null),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .gte("creado_en", inicioMes.toISOString()),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .eq("estado", "exclusiva_firmada")
      .gte("actualizado_en", inicioMes.toISOString()),
  ]);

  const primerNombre = usuario.nombre_completo?.split(" ")[0] ?? "";
  const hora = ahora.getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";

  const seguimientosPendientes =
    (propietariosProximos.data?.length ?? 0) + (compradoresProximos.data?.length ?? 0);

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

  // --- Centro de atención ---------------------------------------------
  const llamadaHoy = (eventosAgenda.data ?? []).find(
    (e) => e.tipo === "llamada" && e.estado === "pendiente" && claveDia(e.fecha_hora) === claveDia(ahora)
  );
  const visitaSinConfirmar = [...(eventosAgenda.data ?? [])]
    .filter(
      (e) => e.tipo === "visita" && e.estado === "pendiente" && !e.confirmado && new Date(e.fecha_hora) >= ahora
    )
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())[0];
  const tareasVencidas = (tareasAgenda.data ?? []).filter(
    (t) => t.estado === "pendiente" && new Date(t.fecha_vencimiento as string) < ahora
  );

  const atencion = [
    llamadaHoy && {
      id: `llamada-${llamadaHoy.id}`,
      icono: "🔴",
      texto: `Llamar: ${llamadaHoy.titulo} (hoy)`,
      href: "/asesor/agenda",
    },
    visitaSinConfirmar && {
      id: `visita-${visitaSinConfirmar.id}`,
      icono: "🟡",
      texto: `Confirmar visita: ${visitaSinConfirmar.titulo}`,
      href: "/asesor/visitas",
    },
    (propietariosProximos.data?.length ?? 0) > 0 && {
      id: "propietarios-seguimiento",
      icono: "🔴",
      texto: `${propietariosProximos.data!.length} propietario${propietariosProximos.data!.length === 1 ? "" : "s"} sin seguimiento`,
      href: "/asesor/propietarios",
    },
    tareasVencidas.length > 0 && {
      id: "tareas-vencidas",
      icono: "🟠",
      texto: `${tareasVencidas.length} tarea${tareasVencidas.length === 1 ? "" : "s"} vencida${tareasVencidas.length === 1 ? "" : "s"}`,
      href: "/asesor/tareas",
    },
  ].filter(Boolean) as { id: string; icono: string; texto: string; href: string }[];

  // --- Próximas acciones (agenda fusionada) ----------------------------
  type ItemProximo = { id: string; icono: string; titulo: string; horaTexto: string; fecha: number; href: string };

  const eventosItems: ItemProximo[] = (eventosAgenda.data ?? [])
    .filter((e) => e.estado === "pendiente" && new Date(e.fecha_hora) >= inicioHoy)
    .map((e) => ({
      id: `evento-${e.id}`,
      icono: EMOJI_TIPO_EVENTO[e.tipo] ?? "🔔",
      titulo: e.titulo,
      horaTexto: new Date(e.fecha_hora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      fecha: new Date(e.fecha_hora).getTime(),
      href: e.tipo === "visita" ? "/asesor/visitas" : "/asesor/agenda",
    }));

  const tareasItems: ItemProximo[] = (tareasAgenda.data ?? [])
    .filter((t) => t.estado === "pendiente")
    .map((t) => ({
      id: `tarea-${t.id}`,
      icono: "✅",
      titulo: t.titulo,
      horaTexto: new Date(t.fecha_vencimiento as string).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
      fecha: new Date(t.fecha_vencimiento as string).getTime(),
      href: "/asesor/tareas",
    }));

  const proximas = [...eventosItems, ...tareasItems].sort((a, b) => a.fecha - b.fecha).slice(0, 6);

  const objetivoCaptaciones = 10;
  const objetivoExclusivas = usuario.tenant?.objetivo_exclusivas_mensual ?? 10;

  const kpis = [
    { label: "Propietarios", valor: propietariosActivos.count ?? 0, icono: Users, href: "/asesor/propietarios", color: "text-violet-500" },
    { label: "Inmuebles", valor: inmueblesTotal.count ?? 0, icono: Building2, href: "/asesor/inmuebles", color: "text-sky-500" },
    { label: "Compradores", valor: compradoresActivos.count ?? 0, icono: ShoppingCart, href: "/asesor/compradores", color: "text-emerald-500" },
    { label: "Visitas de hoy", valor: visitasHoy.count ?? 0, icono: CalendarCheck, href: "/asesor/visitas", color: "text-orange-500" },
    { label: "Tareas pendientes", valor: tareasPendientes.count ?? 0, icono: CheckSquare, href: "/asesor/tareas", color: "text-rose-500" },
    { label: "Exclusivas", valor: exclusivas.count ?? 0, icono: Award, href: "/asesor/propietarios", color: "text-indigo-500" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{saludo}, {primerNombre} 👋</h1>
        <p className="mt-1 text-muted-foreground">
          Hoy tienes {tareasPendientes.count ?? 0} tareas, {seguimientosPendientes} seguimientos y{" "}
          {visitasHoy.count ?? 0} {(visitasHoy.count ?? 0) === 1 ? "visita programada" : "visitas programadas"}.
        </p>
      </div>

      <div className="rounded-2xl border bg-amber-500/5 p-5">
        <h2 className="text-base font-semibold">🚨 Requiere tu atención</h2>
        {atencion.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-600">Todo al día, no hay nada urgente ahora mismo.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {atencion.map((a) => (
              <li key={a.id}>
                <Link href={a.href} className="flex items-center gap-2 text-sm hover:underline">
                  <span>{a.icono}</span>
                  <span>{a.texto}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {kpis.map(({ label, valor, icono: Icono, href, color }) => (
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
          {proximas.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No tienes nada pendiente ahora mismo.</p>
          ) : (
            <ul className="mt-2 divide-y">
              {proximas.map((item) => (
                <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                  <Link href={item.href} className="flex items-center justify-between gap-3 text-sm hover:underline">
                    <span className="flex items-center gap-2">
                      <span>{item.icono}</span>
                      <span>{item.titulo}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.horaTexto}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <Link href="/asesor/agenda" className="block">
            <CalendarioMensual itemsPorDia={agendaPorDia} compacto />
          </Link>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <h2 className="text-sm font-medium">Mi progreso del mes</h2>
        <div className="mt-3 space-y-4">
          <BarraProgreso label="Objetivo captaciones" actual={captacionesMes.count ?? 0} objetivo={objetivoCaptaciones} />
          <BarraProgreso label="Objetivo exclusivas" actual={exclusivasMes.count ?? 0} objetivo={objetivoExclusivas} />
        </div>
      </div>
    </div>
  );
}
