import Link from "next/link";
import { redirect } from "next/navigation";
import {
  UserPlus,
  Award,
  Home,
  Users,
  Phone,
  CalendarCheck,
  HeartPulse,
  Flame,
  Building2,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GraficoLineas } from "@/components/asesor/grafico-lineas";
import { calcularCaptacionScore, diasDesde, estaVencida } from "@/lib/prioridad";
import { ESTADOS_PROPIETARIO } from "../../asesor/propietarios/constantes";

const ETAPAS_EMBUDO = [
  "nuevo_lead",
  "contactado",
  "tasacion_programada",
  "negociacion",
  "exclusiva_firmada",
  "captado",
] as const;

const ETIQUETAS_EMBUDO: Record<string, string> = {
  nuevo_lead: "Leads",
  contactado: "Contactados",
  tasacion_programada: "Tasaciones",
  negociacion: "Negociación",
  exclusiva_firmada: "Exclusivas",
  captado: "Captados",
};

const ETIQUETA_OPORTUNIDAD: Record<string, string> = {
  nuevo_lead: "Primer contacto",
  contactado: "Seguir contacto",
  tasacion_programada: "Tasación pendiente",
  tasacion_realizada: "Enviar propuesta",
  negociacion: "Espera propuesta",
  exclusiva_firmada: "Cerrar captación",
};

function inicioDeMes(fecha = new Date()) {
  const d = new Date(fecha);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function relativo(fechaISO: string): string {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000));
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

const ETIQUETA_ACTIVIDAD: Record<string, string> = {
  nota: "añadió una nota",
  llamada: "registró una llamada",
  email: "registró un email",
  whatsapp: "registró un whatsapp",
  visita: "registró una visita",
  tasacion: "registró una tasación",
  cambio_estado: "cambió el estado",
  tarea_creada: "creó una tarea",
  tarea_completada: "completó una tarea",
  sistema: "hizo un cambio",
};

export default async function CentroDeControlPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const tenantId = usuario.tenant_id;
  const objetivoExclusivas = usuario.tenant?.objetivo_exclusivas_mensual ?? 20;

  const ahora = new Date();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const inicioMes = inicioDeMes(ahora);
  const inicioMesAnterior = inicioDeMes(new Date(inicioMes.getTime() - 1));
  const inicioHistorico = new Date();
  inicioHistorico.setMonth(inicioHistorico.getMonth() - 5);
  inicioHistorico.setDate(1);
  inicioHistorico.setHours(0, 0, 0, 0);

  const [
    { count: propietariosNuevosMes },
    { count: propietariosNuevosMesAnterior },
    { count: exclusivasMes },
    { count: inmueblesActivos },
    { count: compradoresActivos },
    propietariosSeguimiento,
    compradoresSeguimiento,
    { count: visitasHoy },
    { count: tasacionesPendientes },
    usuariosEquipo,
    propietariosParaSalud,
    propietariosHistorico,
    propietariosParaEmbudo,
    propietariosParaRanking,
    eventosHoy,
    tareasPendientes,
    actividadReciente,
    propietariosParaScore,
    inmueblesParaCartera,
  ] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("creado_en", inicioMes.toISOString()),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("creado_en", inicioMesAnterior.toISOString())
      .lt("creado_en", inicioMes.toISOString()),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("estado", "exclusiva_firmada")
      .gte("actualizado_en", inicioMes.toISOString()),
    supabase
      .from("inmuebles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .neq("estado", "vendido"),
    supabase
      .from("compradores")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .not("estado", "in", "(comprado,perdido)"),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .not("estado", "in", "(captado,perdido)")
      .not("fecha_proxima_accion", "is", null)
      .lte("fecha_proxima_accion", ahora.toISOString()),
    supabase
      .from("compradores")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .not("estado", "in", "(comprado,perdido)")
      .not("fecha_proxima_accion", "is", null)
      .lte("fecha_proxima_accion", ahora.toISOString()),
    supabase
      .from("eventos_agenda")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("tipo", "visita")
      .gte("fecha_hora", inicioHoy.toISOString())
      .lte("fecha_hora", finHoy.toISOString()),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("estado", "tasacion_programada"),
    supabase
      .from("usuarios")
      .select("id, nombre_completo, rol")
      .eq("tenant_id", tenantId)
      .eq("activo", true),
    supabase
      .from("propietarios")
      .select("id, estado, fecha_ultimo_contacto, fecha_proxima_accion")
      .eq("tenant_id", tenantId)
      .not("estado", "in", "(captado,perdido)"),
    supabase
      .from("propietarios")
      .select("creado_en")
      .eq("tenant_id", tenantId)
      .gte("creado_en", inicioHistorico.toISOString()),
    supabase.from("propietarios").select("estado").eq("tenant_id", tenantId),
    supabase
      .from("propietarios")
      .select("agente_id, estado")
      .eq("tenant_id", tenantId)
      .in("estado", ["exclusiva_firmada", "captado"])
      .gte("actualizado_en", inicioMes.toISOString()),
    supabase
      .from("eventos_agenda")
      .select("id, tipo, titulo, fecha_hora")
      .eq("tenant_id", tenantId)
      .eq("estado", "pendiente")
      .gte("fecha_hora", inicioHoy.toISOString())
      .lte("fecha_hora", finHoy.toISOString())
      .order("fecha_hora")
      .limit(6),
    supabase
      .from("tareas")
      .select("id, titulo, fecha_vencimiento")
      .eq("tenant_id", tenantId)
      .eq("estado", "pendiente")
      .order("fecha_vencimiento", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from("actividades")
      .select("id, tipo, contenido, usuario_id, creado_en")
      .eq("tenant_id", tenantId)
      .order("creado_en", { ascending: false })
      .limit(6),
    supabase
      .from("propietarios")
      .select("id, nombre, estado, fecha_ultimo_contacto, fecha_proxima_accion, valor_estimado, fuente_lead")
      .eq("tenant_id", tenantId)
      .not("estado", "in", "(captado,perdido)"),
    supabase
      .from("inmuebles")
      .select("id, estado, creado_en")
      .eq("tenant_id", tenantId),
  ]);

  const nombrePorUsuario = new Map(
    (usuariosEquipo.data ?? []).map((u) => [u.id, u.nombre_completo as string])
  );

  // --- Salud comercial ---------------------------------------------------
  const listaSalud = propietariosParaSalud.data ?? [];
  const alDia = listaSalud.filter((p) => !estaVencida(p.fecha_proxima_accion)).length;
  const pctAlDia = listaSalud.length > 0 ? Math.round((alDia / listaSalud.length) * 100) : 100;
  const sinContactoLargo = listaSalud.filter((p) => {
    const dias = diasDesde(p.fecha_ultimo_contacto);
    return dias === null || dias >= 10;
  }).length;
  const ritmoSubio = (propietariosNuevosMes ?? 0) >= (propietariosNuevosMesAnterior ?? 0);
  const penalizacionInactivos = Math.min(30, sinContactoLargo * 5);
  const saludScore = Math.max(
    0,
    Math.min(100, Math.round(pctAlDia * 0.6 + (ritmoSubio ? 30 : 10) - penalizacionInactivos + 10))
  );
  const saludLabel =
    saludScore >= 85 ? "Excelente" : saludScore >= 70 ? "Buena" : saludScore >= 50 ? "Regular" : "Necesita atención";
  const saludColor =
    saludScore >= 85 ? "text-emerald-600" : saludScore >= 70 ? "text-sky-600" : saludScore >= 50 ? "text-amber-600" : "text-rose-600";

  // --- Captaciones últimos 6 meses ---------------------------------------
  const meses: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = inicioDeMes(new Date());
    d.setMonth(d.getMonth() - i);
    meses.push(d);
  }
  const captacionesPorMes = new Array(meses.length).fill(0);
  for (const p of propietariosHistorico.data ?? []) {
    const fecha = new Date(p.creado_en);
    const idx = meses.findIndex(
      (m) => m.getFullYear() === fecha.getFullYear() && m.getMonth() === fecha.getMonth()
    );
    if (idx >= 0) captacionesPorMes[idx] += 1;
  }
  const etiquetasMeses = meses.map((m) => m.toLocaleDateString("es-ES", { month: "short" }));

  // --- Embudo de captación -------------------------------------------------
  const ordenEstado = ESTADOS_PROPIETARIO.reduce<Record<string, number>>((acc, e, i) => {
    acc[e] = i;
    return acc;
  }, {});
  const totalLeads = (propietariosParaEmbudo.data ?? []).filter((p) => p.estado !== "perdido").length;
  const embudo = ETAPAS_EMBUDO.map((etapa) => ({
    etapa,
    label: ETIQUETAS_EMBUDO[etapa],
    valor: (propietariosParaEmbudo.data ?? []).filter(
      (p) => p.estado !== "perdido" && ordenEstado[p.estado] >= ordenEstado[etapa]
    ).length,
  }));
  const captadosTotal = embudo.find((e) => e.etapa === "captado")?.valor ?? 0;
  const conversion = totalLeads > 0 ? Math.round((captadosTotal / totalLeads) * 100) : 0;

  // --- Ranking de asesores --------------------------------------------------
  const conteoPorAgente = new Map<string, number>();
  for (const p of propietariosParaRanking.data ?? []) {
    if (!p.agente_id) continue;
    conteoPorAgente.set(p.agente_id, (conteoPorAgente.get(p.agente_id) ?? 0) + 1);
  }
  const ranking = [...conteoPorAgente.entries()]
    .map(([agenteId, total]) => ({ nombre: nombrePorUsuario.get(agenteId) ?? "—", total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const medallas = ["🥇", "🥈", "🥉"];

  // --- Tareas críticas ----------------------------------------------------
  const tareasClasificadas = (tareasPendientes.data ?? []).map((t) => {
    const vencida = t.fecha_vencimiento ? estaVencida(t.fecha_vencimiento) : false;
    const hoy =
      t.fecha_vencimiento &&
      new Date(t.fecha_vencimiento) >= inicioHoy &&
      new Date(t.fecha_vencimiento) <= finHoy;
    const nivel = vencida ? "🔴" : hoy ? "🟡" : "🟢";
    return { ...t, nivel };
  });

  // --- Oportunidades calientes ---------------------------------------------
  const oportunidades = (propietariosParaScore.data ?? [])
    .map((p) => ({
      nombre: p.nombre,
      score: calcularCaptacionScore(p),
      etiqueta: estaVencida(p.fecha_proxima_accion) ? "Llamar hoy" : ETIQUETA_OPORTUNIDAD[p.estado] ?? "Seguir",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // --- Rendimiento de cartera ------------------------------------------------
  const cartera = inmueblesParaCartera.data ?? [];
  const carteraStats = {
    activos: cartera.filter((i) => i.estado !== "vendido").length,
    vendidos: cartera.filter((i) => i.estado === "vendido").length,
    reservados: cartera.filter((i) => i.estado === "reservado").length,
    nuevos: cartera.filter((i) => new Date(i.creado_en) >= inicioMes).length,
  };

  // --- Atención requerida ------------------------------------------------
  const seguimientosVencidos = (propietariosSeguimiento.count ?? 0) + (compradoresSeguimiento.count ?? 0);
  const idsConActividadHoy = new Set(
    (actividadReciente.data ?? [])
      .filter((a) => new Date(a.creado_en) >= inicioHoy && a.usuario_id)
      .map((a) => a.usuario_id as string)
  );
  const empleadosSinActividad = (usuariosEquipo.data ?? []).filter(
    (u) => u.rol === "empleado" && !idsConActividadHoy.has(u.id)
  ).length;

  const kpis = [
    {
      label: "Propietarios nuevos",
      valor: propietariosNuevosMes ?? 0,
      icono: UserPlus,
      color: "text-sky-500",
    },
    {
      label: "Exclusivas",
      valor: `${exclusivasMes ?? 0}`,
      sub: `Objetivo: ${objetivoExclusivas}`,
      icono: Award,
      color: "text-indigo-500",
    },
    { label: "Inmuebles activos", valor: inmueblesActivos ?? 0, icono: Home, color: "text-emerald-500" },
    { label: "Compradores activos", valor: compradoresActivos ?? 0, icono: Users, color: "text-violet-500" },
    { label: "Seguimientos pendientes", valor: seguimientosVencidos, icono: Phone, color: "text-amber-500" },
    { label: "Visitas de hoy", valor: visitasHoy ?? 0, icono: CalendarCheck, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Centro de Control</h1>
        <p className="mt-1 text-muted-foreground">{usuario.tenant?.nombre}</p>
      </div>

      {/* Atención requerida */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Bell className="size-4" /> Atención requerida
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <span>🔴 {seguimientosVencidos} seguimientos vencidos</span>
          <span>🟡 {tasacionesPendientes ?? 0} tasaciones pendientes</span>
          <span>🟠 {empleadosSinActividad} sin actividad hoy</span>
          <span>🟢 {propietariosNuevosMes ?? 0} nuevas captaciones este mes</span>
        </div>
      </div>

      {/* Fila 1 — KPIs */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {kpis.map(({ label, valor, sub, icono: Icono, color }) => (
          <div key={label} className="flex flex-col gap-1 rounded-lg border p-3">
            <Icono className={`size-4 ${color}`} />
            <span className="text-xl font-semibold">{valor}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
            {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
          </div>
        ))}
      </div>

      {/* Fila 2 — Salud comercial */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <HeartPulse className={`size-6 ${saludColor}`} />
          <div>
            <p className="text-sm font-medium">Salud Comercial</p>
            <p className={`text-2xl font-semibold ${saludColor}`}>
              {saludScore}/100 <span className="text-sm font-normal">{saludLabel}</span>
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          <li>{pctAlDia >= 90 ? "✔" : "⚠"} {pctAlDia}% de seguimientos al día</li>
          <li>{ritmoSubio ? "✔ Buen ritmo de captación" : "⚠ El ritmo de captación bajó este mes"}</li>
          <li>
            {sinContactoLargo > 0
              ? `⚠ ${sinContactoLargo} propietarios llevan más de 10 días sin contacto`
              : "✔ Nadie lleva más de 10 días sin contacto"}
          </li>
        </ul>
      </div>

      {/* Fila 3 — Captaciones + Exclusivas vs objetivo */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3 md:col-span-2">
          <h2 className="text-sm font-medium">Captaciones (últimos 6 meses)</h2>
          <div className="mt-2">
            <GraficoLineas
              etiquetas={etiquetasMeses}
              series={[{ nombre: "Captaciones", color: "#0ea5e9", valores: captacionesPorMes }]}
            />
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Exclusivas este mes</h2>
          <p className="mt-2 text-3xl font-semibold">{exclusivasMes ?? 0}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{
                width: `${Math.min(100, ((exclusivasMes ?? 0) / Math.max(1, objetivoExclusivas)) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Objetivo: {objetivoExclusivas}</p>
        </div>
      </div>

      {/* Fila 4 — Embudo + conversión */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3 md:col-span-2">
          <h2 className="text-sm font-medium">Embudo de captación</h2>
          <div className="mt-3 space-y-1.5">
            {embudo.map((e) => {
              const max = Math.max(1, embudo[0].valor);
              return (
                <div key={e.etapa} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">{e.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${(e.valor / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-medium">{e.valor}</span>
                </div>
              );
            })}
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
          <p className="text-center text-xs text-muted-foreground">Lead → Captado</p>
        </div>
      </div>

      {/* Fila 5 — Ranking de asesores */}
      <div className="rounded-lg border p-3">
        <h2 className="text-sm font-medium">Ranking de asesores (este mes)</h2>
        {ranking.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Todavía no hay exclusivas ni captaciones registradas este mes.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {ranking.map((r, i) => (
              <li key={r.nombre} className="flex items-center justify-between text-sm">
                <span>{medallas[i] ?? `${i + 1}º`} {r.nombre}</span>
                <span className="font-medium">{r.total}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fila 6 — Agenda de hoy + tareas críticas */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Agenda de hoy</h2>
          {(eventosHoy.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No hay eventos programados para hoy.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {(eventosHoy.data ?? []).map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span>{e.titulo}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.fecha_hora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Tareas críticas</h2>
          {tareasClasificadas.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" /> No hay tareas pendientes.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {tareasClasificadas.map((t) => (
                <li key={t.id} className="text-sm">
                  {t.nivel} {t.titulo}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Fila 7 — Actividad reciente */}
      <div className="rounded-lg border p-3">
        <h2 className="text-sm font-medium">Actividad reciente</h2>
        {(actividadReciente.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Todavía no hay actividad registrada.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {(actividadReciente.data ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-medium">{nombrePorUsuario.get(a.usuario_id ?? "") ?? "Alguien"}</span>{" "}
                  {ETIQUETA_ACTIVIDAD[a.tipo] ?? "hizo un cambio"}
                </span>
                <span className="text-xs text-muted-foreground">{relativo(a.creado_en)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fila 8 — Oportunidades calientes */}
      <div className="rounded-lg border p-3">
        <h2 className="flex items-center gap-1.5 text-sm font-medium">
          <Flame className="size-4 text-orange-500" /> Oportunidades calientes
        </h2>
        {oportunidades.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No hay captaciones activas todavía.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {oportunidades.map((o) => (
              <li key={o.nombre} className="flex items-center justify-between text-sm">
                <span>{o.nombre}</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{o.score}</span>
                  <span className="text-xs text-muted-foreground">{o.etiqueta}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fila 9 — Rendimiento de cartera */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-lg border bg-sky-500/10 p-3">
          <p className="text-xl font-semibold text-sky-600">{carteraStats.activos}</p>
          <p className="text-xs text-muted-foreground">Activos</p>
        </div>
        <div className="rounded-lg border bg-emerald-500/10 p-3">
          <p className="text-xl font-semibold text-emerald-600">{carteraStats.vendidos}</p>
          <p className="text-xs text-muted-foreground">Vendidos</p>
        </div>
        <div className="rounded-lg border bg-amber-500/10 p-3">
          <p className="text-xl font-semibold text-amber-600">{carteraStats.reservados}</p>
          <p className="text-xs text-muted-foreground">Reservados</p>
        </div>
        <div className="rounded-lg border bg-violet-500/10 p-3">
          <p className="text-xl font-semibold text-violet-600">{carteraStats.nuevos}</p>
          <p className="text-xs text-muted-foreground">Nuevos este mes</p>
        </div>
      </div>

      <Link
        href="/inmobiliaria"
        className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-accent"
      >
        <Building2 className="size-4" /> Volver a la vista general
      </Link>
    </div>
  );
}
