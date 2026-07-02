import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Home, Star, Building2, Users, Phone, Calendar,
  ArrowUpRight, ArrowDownRight, Trophy, AlertCircle,
  CheckCircle2, Clock, TrendingUp, Plus,
  UserSearch, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function BarInline({
  value,
  max,
  color = "bg-primary",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default async function CentroControlPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();
  const tid = usuario.tenant_id;
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString();
  const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59).toISOString();
  const hace10dias = new Date(Date.now() - 10 * 86400000).toISOString();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

  // ── parallel queries ────────────────────────────────────────────────────
  const [
    { data: todosProps },
    { data: todosInm },
    { data: todosComp },
    { data: eventosHoy },
    { data: tareasCriticas },
    { data: actividadReciente },
    { data: miembros },
    { data: ventasCompletadas },
    { data: eventosVencidos },
    { data: captacionesMes },
    { data: captacionesMesAnterior },
  ] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id, nombre, estado, fecha_ultimo_contacto, agente_id, valor_estimado, creado_en")
      .eq("tenant_id", tid),
    supabase
      .from("inmuebles")
      .select("id, estado, precio, tipo, agente_id")
      .eq("tenant_id", tid),
    supabase
      .from("compradores")
      .select("id, nombre, estado, fecha_ultimo_contacto, urgencia, presupuesto_max, agente_id")
      .eq("tenant_id", tid),
    supabase
      .from("eventos_agenda")
      .select("id, titulo, tipo, fecha_hora, estado")
      .eq("tenant_id", tid)
      .eq("tipo", "visita")
      .gte("fecha_hora", inicioHoy)
      .lte("fecha_hora", finHoy)
      .neq("estado", "cancelado"),
    supabase
      .from("tareas")
      .select("id, titulo, fecha_vencimiento, completada, entidad_tipo")
      .eq("tenant_id", tid)
      .eq("completada", false)
      .order("fecha_vencimiento", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase
      .from("actividades")
      .select("id, tipo, contenido, creado_en, usuario_id")
      .eq("tenant_id", tid)
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("usuarios")
      .select("id, nombre_completo, email, rol, activo")
      .eq("tenant_id", tid)
      .eq("activo", true),
    supabase
      .from("ventas")
      .select("id, precio_venta, comision_importe, agente_id")
      .eq("tenant_id", tid)
      .eq("estado", "completada"),
    supabase
      .from("eventos_agenda")
      .select("id, titulo, tipo, fecha_hora")
      .eq("tenant_id", tid)
      .lt("fecha_hora", inicioHoy)
      .eq("estado", "pendiente")
      .limit(20),
    supabase
      .from("propietarios")
      .select("id")
      .eq("tenant_id", tid)
      .gte("creado_en", inicioMes),
    supabase
      .from("propietarios")
      .select("id")
      .eq("tenant_id", tid)
      .gte("creado_en", inicioMesAnterior)
      .lte("creado_en", finMesAnterior),
  ]);

  // ── computed metrics ────────────────────────────────────────────────────
  const props = todosProps ?? [];
  const inms = todosInm ?? [];
  const comps = todosComp ?? [];

  const propNuevosMes = captacionesMes?.length ?? 0;
  const propMesAnterior = captacionesMesAnterior?.length ?? 0;
  const cambioProps =
    propMesAnterior > 0
      ? Math.round(((propNuevosMes - propMesAnterior) / propMesAnterior) * 100)
      : propNuevosMes > 0 ? 100 : 0;

  const exclusivas = props.filter(p => p.estado === "exclusiva_firmada" || p.estado === "captado").length;
  const objetivoExclusivas = 20;

  const inmActivosCount = inms.filter(i => !["vendido"].includes(i.estado)).length;
  const compActivosCount = comps.filter(c => !["comprado", "perdido"].includes(c.estado)).length;
  const visitasHoyCount = eventosHoy?.length ?? 0;
  const seguimientosPendientes = eventosVencidos?.length ?? 0;

  // Propietarios sin contacto > 10 días
  const propsSinContacto = props.filter(p =>
    p.fecha_ultimo_contacto && new Date(p.fecha_ultimo_contacto) < new Date(hace10dias)
  ).length;

  // ── salud comercial score ──────────────────────────────────────────────
  const tareasVencidas = (tareasCriticas ?? []).filter(
    t => t.fecha_vencimiento && new Date(t.fecha_vencimiento) < hoy
  ).length;
  let salud = 70;
  if (tareasVencidas === 0) salud += 10; else salud -= Math.min(tareasVencidas * 5, 20);
  if (propNuevosMes >= propMesAnterior) salud += 10; else salud -= 10;
  salud -= Math.min(propsSinContacto * 5, 20);
  if (visitasHoyCount > 0) salud += 5;
  if (seguimientosPendientes === 0) salud += 5;
  salud = Math.max(0, Math.min(100, salud));

  const etiquetaSalud =
    salud >= 85 ? "Excelente" : salud >= 70 ? "Buena" : salud >= 50 ? "Regular" : "Atención";
  const colorSalud =
    salud >= 85 ? "text-emerald-600 dark:text-emerald-400"
    : salud >= 70 ? "text-blue-600 dark:text-blue-400"
    : salud >= 50 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  // ── captaciones por mes (últimos 6 meses) ──────────────────────────────
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1);
    return {
      label: d.toLocaleDateString("es-ES", { month: "short" }),
      inicio: d.toISOString(),
      fin: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    };
  });
  const captsPorMes = meses.map(m => ({
    label: m.label,
    value: props.filter(p => p.creado_en >= m.inicio && p.creado_en <= m.fin).length,
  }));
  const maxCapts = Math.max(...captsPorMes.map(m => m.value), 1);

  // ── embudo ────────────────────────────────────────────────────────────
  const embudo = [
    { label: "Leads", count: props.filter(p => p.estado === "nuevo_lead").length, color: "bg-primary" },
    { label: "Contactados", count: props.filter(p => p.estado === "contactado").length, color: "bg-blue-500" },
    { label: "Tasaciones", count: props.filter(p => ["tasacion_programada", "tasacion_realizada"].includes(p.estado)).length, color: "bg-violet-500" },
    { label: "Negociación", count: props.filter(p => p.estado === "negociacion").length, color: "bg-amber-500" },
    { label: "Exclusivas", count: exclusivas, color: "bg-emerald-500" },
    { label: "Captados", count: props.filter(p => p.estado === "captado").length, color: "bg-teal-500" },
  ];
  const totalLeads = embudo[0].count;
  const conversionRate =
    totalLeads > 0 ? Math.round((exclusivas / totalLeads) * 100) : 0;

  // ── ranking agentes ───────────────────────────────────────────────────
  const agentesActivos = (miembros ?? []).filter(m => !esGestor(m.rol));
  const rankingAgentes = agentesActivos.map(a => {
    const misProps = props.filter(p => p.agente_id === a.id).length;
    const misExcl = props.filter(p => p.agente_id === a.id && ["exclusiva_firmada","captado"].includes(p.estado)).length;
    const misVentas = (ventasCompletadas ?? []).filter(v => v.agente_id === a.id).length;
    return {
      ...a,
      captaciones: misProps,
      exclusivas: misExcl,
      ventas: misVentas,
      puntos: misExcl * 10 + misVentas * 15 + misProps,
    };
  }).sort((a, b) => b.puntos - a.puntos).slice(0, 5);

  // ── agenda hoy ────────────────────────────────────────────────────────
  const agendaHoy = [...(eventosHoy ?? [])].sort(
    (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
  );

  // ── oportunidades calientes (compradores por score) ──────────────────
  const oportunidades = comps
    .filter(c => !["comprado","perdido"].includes(c.estado))
    .map(c => {
      let score = 50;
      if (c.urgencia === "alta") score += 30;
      else if (c.urgencia === "media") score += 15;
      if (c.estado === "oferta" || c.estado === "reserva") score += 20;
      else if (c.estado === "busqueda_activa" || c.estado === "visitas") score += 10;
      if (c.presupuesto_max && c.presupuesto_max > 200000) score += 5;
      const daysSinContact = c.fecha_ultimo_contacto
        ? Math.floor((Date.now() - new Date(c.fecha_ultimo_contacto).getTime()) / 86400000)
        : 99;
      if (daysSinContact <= 2) score += 10; else if (daysSinContact > 7) score -= 10;
      return { ...c, score: Math.min(99, score) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // ── cartera inmuebles ─────────────────────────────────────────────────
  const vendidos = inms.filter(i => i.estado === "vendido").length;
  const reservados = inms.filter(i => i.estado === "reservado").length;
  const nuevosInm = inms.filter(i => new Date(i.creado_en ?? 0) >= new Date(inicioMes)).length;

  // ── atención requerida ────────────────────────────────────────────────
  const alertas: { color: string; texto: string }[] = [];
  if (tareasVencidas > 0) alertas.push({ color: "text-red-500", texto: `${tareasVencidas} seguimiento${tareasVencidas > 1 ? "s" : ""} vencido${tareasVencidas > 1 ? "s" : ""}` });
  if (propsSinContacto > 0) alertas.push({ color: "text-amber-500", texto: `${propsSinContacto} propietario${propsSinContacto > 1 ? "s" : ""} sin contacto hace +10 días` });
  if (seguimientosPendientes > 0) alertas.push({ color: "text-orange-500", texto: `${seguimientosPendientes} cita${seguimientosPendientes > 1 ? "s" : ""} sin gestionar` });
  if (propNuevosMes > 0) alertas.push({ color: "text-emerald-500", texto: `${propNuevosMes} nueva${propNuevosMes > 1 ? "s" : ""} captación${propNuevosMes > 1 ? "es" : ""} este mes` });

  const medallas = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      {/* ── título ── */}
      <div>
        <h1 className="text-2xl font-bold">Centro de Control</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {hoy.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── ATENCIÓN REQUERIDA ── */}
      {alertas.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-950/20">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <AlertCircle className="size-4" /> Atención requerida
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {alertas.map((a, i) => (
              <p key={i} className={`text-sm ${a.color} font-medium`}>
                {a.color === "text-red-500" ? "🔴" : a.color === "text-amber-500" ? "🟡" : a.color === "text-orange-500" ? "🟠" : "🟢"}{" "}
                {a.texto}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── FILA 1: 6 KPIs ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            icon: Home,
            label: "Propietarios nuevos",
            value: propNuevosMes,
            sub: cambioProps !== 0 ? `${cambioProps > 0 ? "+" : ""}${cambioProps}% vs mes ant.` : "Sin cambio",
            positive: cambioProps >= 0,
            color: "text-violet-500",
          },
          {
            icon: Star,
            label: "Exclusivas",
            value: exclusivas,
            sub: `Objetivo: ${objetivoExclusivas}`,
            positive: exclusivas >= objetivoExclusivas * 0.7,
            color: "text-amber-500",
          },
          {
            icon: Building2,
            label: "Inmuebles activos",
            value: inmActivosCount,
            sub: `${vendidos} vendidos`,
            positive: true,
            color: "text-blue-500",
          },
          {
            icon: Users,
            label: "Compradores activos",
            value: compActivosCount,
            sub: `${comps.filter(c => c.urgencia === "alta").length} urgentes`,
            positive: true,
            color: "text-sky-500",
          },
          {
            icon: Phone,
            label: "Seguimientos pendientes",
            value: seguimientosPendientes,
            sub: "Citas sin gestionar",
            positive: seguimientosPendientes === 0,
            color: "text-orange-500",
          },
          {
            icon: Calendar,
            label: "Visitas de hoy",
            value: visitasHoyCount,
            sub: "Programadas hoy",
            positive: visitasHoyCount > 0,
            color: "text-emerald-500",
          },
        ].map(({ icon: Icon, label, value, sub, positive, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <Icon className={`mb-2 size-5 ${color}`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 flex items-center gap-0.5 text-xs font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── FILA 2: Salud Comercial ── */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Salud Comercial</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className={`text-5xl font-black ${colorSalud}`}>{salud}</span>
              <span className="text-xl text-muted-foreground">/100</span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                salud >= 85 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : salud >= 70 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : salud >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>{etiquetaSalud}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            {tareasVencidas === 0
              ? <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-4" /> Seguimientos al día</p>
              : <p className="flex items-center gap-2 text-red-500"><AlertCircle className="size-4" /> {tareasVencidas} seguimiento{tareasVencidas > 1 ? "s" : ""} vencido{tareasVencidas > 1 ? "s" : ""}</p>
            }
            {propNuevosMes >= propMesAnterior
              ? <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-4" /> Buen ritmo de captación</p>
              : <p className="flex items-center gap-2 text-amber-500"><AlertCircle className="size-4" /> Ritmo de captación bajo</p>
            }
            {propsSinContacto > 0 && (
              <p className="flex items-center gap-2 text-amber-500"><AlertCircle className="size-4" /> {propsSinContacto} propietario{propsSinContacto > 1 ? "s" : ""} sin contacto +10 días</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <BarInline value={salud} max={100} color={salud >= 85 ? "bg-emerald-500" : salud >= 70 ? "bg-blue-500" : salud >= 50 ? "bg-amber-500" : "bg-red-500"} />
        </div>
      </div>

      {/* ── FILA 3: Captaciones + Exclusivas ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Captaciones mensual */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 font-semibold">Captaciones últimos 6 meses</p>
          <div className="space-y-2">
            {captsPorMes.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-8 text-xs capitalize text-muted-foreground">{label}</span>
                <div className="flex-1">
                  <BarInline value={value} max={maxCapts} />
                </div>
                <span className="w-6 text-right text-xs font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Exclusivas objetivo */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 font-semibold">Exclusivas este mes</p>
          <div className="flex items-center justify-center gap-8">
            <div className="relative flex size-32 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-muted" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="10"
                  strokeLinecap="round"
                  className="stroke-amber-500"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - exclusivas / objetivoExclusivas)}`}
                />
              </svg>
              <div className="text-center">
                <p className="text-3xl font-black">{exclusivas}</p>
                <p className="text-xs text-muted-foreground">/{objetivoExclusivas}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Conseguidas</p>
                <p className="text-2xl font-bold text-amber-500">{exclusivas}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faltan</p>
                <p className="text-xl font-bold">{Math.max(0, objetivoExclusivas - exclusivas)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objetivo</p>
                <p className="text-sm font-medium">{objetivoExclusivas}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILA 4: Embudo + Conversión ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <p className="mb-4 font-semibold">Embudo de captación</p>
          <div className="space-y-2">
            {embudo.map(({ label, count, color }, i) => {
              const pct = embudo[0].count > 0 ? Math.round((count / embudo[0].count) * 100) : 0;
              const width = `${Math.max(20, pct)}%`;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-24 text-right text-sm text-muted-foreground">{label}</span>
                  <div className="flex-1">
                    <div
                      className={`flex h-8 items-center justify-end rounded-r-full px-3 text-xs font-bold text-white transition-all ${color}`}
                      style={{ width }}
                    >
                      {count}
                    </div>
                  </div>
                  {i < embudo.length - 1 && embudo[i + 1].count > 0 && (
                    <span className="w-12 text-xs text-muted-foreground">
                      {Math.round((embudo[i + 1].count / Math.max(count, 1)) * 100)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 font-semibold">Conversión</p>
          <p className="text-xs text-muted-foreground">Lead → Exclusiva</p>
          <p className="mt-1 text-5xl font-black text-primary">{conversionRate}%</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {exclusivas} exclusivas de {embudo[0].count} leads totales
          </p>
          <div className="mt-4 space-y-2 border-t pt-4">
            {embudo.slice(0, 3).map(({ label, count }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILA 5 + 6: Ranking + Agenda ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ranking */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 font-semibold"><Trophy className="size-4 text-amber-500" /> Ranking de asesores</p>
            <Link href="/inmobiliaria/agentes" className="text-xs text-primary hover:underline">Ver informe →</Link>
          </div>
          {rankingAgentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay agentes activos</p>
          ) : (
            <div className="space-y-3">
              {rankingAgentes.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-xl">{medallas[i] ?? `${i + 1}º`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{a.nombre_completo ?? a.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.exclusivas} excl · {a.captaciones} capt · {a.ventas} ventas
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">{a.puntos} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agenda hoy + tareas críticas */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 font-semibold flex items-center gap-2"><CalendarDays className="size-4 text-primary" /> Agenda de hoy</p>
          {agendaHoy.length === 0 ? (
            <p className="mb-3 text-sm text-muted-foreground">Sin visitas programadas hoy</p>
          ) : (
            <div className="mb-4 space-y-2">
              {agendaHoy.slice(0, 4).map(ev => (
                <div key={ev.id} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="w-12 shrink-0 text-xs font-semibold">
                    {new Date(ev.fecha_hora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="truncate text-sm">{ev.titulo}</span>
                </div>
              ))}
            </div>
          )}
          {(tareasCriticas ?? []).length > 0 && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tareas críticas</p>
              <div className="space-y-1">
                {tareasCriticas!.slice(0, 4).map(t => {
                  const vencida = t.fecha_vencimiento && new Date(t.fecha_vencimiento) < hoy;
                  const proxima = t.fecha_vencimiento && new Date(t.fecha_vencimiento).toDateString() === hoy.toDateString();
                  return (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <span>{vencida ? "🔴" : proxima ? "🟡" : "🟢"}</span>
                      <span className="flex-1 truncate">{t.titulo}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── FILA 7 + 8: Actividad + Oportunidades ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Actividad reciente */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 font-semibold">Actividad reciente</p>
          {(actividadReciente ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
          ) : (
            <div className="space-y-3">
              {actividadReciente!.map((a, i) => {
                const hace = Math.floor((Date.now() - new Date(a.creado_en).getTime()) / 60000);
                const agenteAct = (miembros ?? []).find(m => m.id === a.usuario_id);
                return (
                  <div key={a.id}>
                    {i > 0 && <div className="my-2 border-t" />}
                    <div className="flex items-start gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(agenteAct?.nombre_completo ?? agenteAct?.email ?? "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm">{a.contenido}</p>
                        <p className="text-xs text-muted-foreground">
                          {hace < 60 ? `Hace ${hace} min` : `Hace ${Math.floor(hace / 60)} h`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Oportunidades calientes */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 flex items-center gap-2 font-semibold">
            Oportunidades calientes 🔥
          </p>
          {oportunidades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay compradores activos</p>
          ) : (
            <div className="space-y-3">
              {oportunidades.map((c, i) => (
                <div key={c.id}>
                  {i > 0 && <div className="my-2 border-t" />}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white",
                      c.score >= 90 ? "bg-red-500" : c.score >= 75 ? "bg-amber-500" : "bg-blue-500"
                    )}>
                      {c.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {c.estado.replace("_", " ")} · {c.urgencia === "alta" ? "🔥 Urgente" : c.urgencia === "media" ? "Activo" : "Bajo seguimiento"}
                      </p>
                    </div>
                    <Link href={`/inmobiliaria/compradores/${c.id}`} className="text-xs text-primary hover:underline">Ver →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FILA 9 + 10: Cartera + Acciones rápidas ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cartera */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 flex items-center gap-2 font-semibold">
            <TrendingUp className="size-4 text-primary" /> Rendimiento de la cartera
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total inmuebles", value: inms.length, color: "text-primary" },
              { label: "Vendidos", value: vendidos, color: "text-emerald-500" },
              { label: "Reservados", value: reservados, color: "text-amber-500" },
              { label: "Nuevos este mes", value: nuevosInm, color: "text-blue-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex gap-0.5 overflow-hidden rounded-full">
              {[
                { estado: "captacion", count: inms.filter(i => i.estado === "captacion").length, color: "bg-muted" },
                { estado: "preparacion", count: inms.filter(i => i.estado === "preparacion").length, color: "bg-blue-200 dark:bg-blue-800" },
                { estado: "publicado", count: inms.filter(i => i.estado === "publicado").length, color: "bg-primary/60" },
                { estado: "visitas", count: inms.filter(i => i.estado === "visitas").length, color: "bg-violet-400" },
                { estado: "oferta", count: inms.filter(i => i.estado === "oferta").length, color: "bg-amber-400" },
                { estado: "reservado", count: inms.filter(i => i.estado === "reservado").length, color: "bg-orange-400" },
                { estado: "vendido", count: inms.filter(i => i.estado === "vendido").length, color: "bg-emerald-500" },
              ].filter(s => s.count > 0).map(({ estado, count, color }) => (
                <div
                  key={estado}
                  title={`${estado}: ${count}`}
                  className={`h-3 ${color}`}
                  style={{ flex: count }}
                />
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {[
                { label: "Captación", color: "bg-muted" },
                { label: "Publicado", color: "bg-primary/60" },
                { label: "En visitas", color: "bg-violet-400" },
                { label: "Reservado", color: "bg-orange-400" },
                { label: "Vendido", color: "bg-emerald-500" },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={`size-2 rounded-full ${color}`} />{label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 font-semibold">Acciones rápidas</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: "/inmobiliaria/propietarios/nuevo", icon: Plus, label: "Nuevo propietario", color: "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400" },
              { href: "/inmobiliaria/inmuebles/nuevo", icon: Building2, label: "Nuevo inmueble", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400" },
              { href: "/inmobiliaria/compradores/nuevo", icon: UserSearch, label: "Nuevo comprador", color: "bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400" },
              { href: "/inmobiliaria/visitas", icon: CalendarDays, label: "Nueva visita", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400" },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center text-sm font-medium transition-colors ${color}`}
              >
                <Icon className="size-6" />
                <span className="text-xs leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
