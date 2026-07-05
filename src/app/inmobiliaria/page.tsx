import Link from "next/link";
import { redirect } from "next/navigation";
import {
  UserPlus,
  Award,
  Home,
  Users,
  Phone,
  CalendarCheck,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  CalendarDays,
  Bell,
} from "lucide-react";
import { getUsuarioConTenant, obtenerImpersonacion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  calcularCaptacionScore,
  calcularPrioridad,
  calcularPrioridadComprador,
  diasDesde,
  estaVencida,
} from "@/lib/prioridad";
import { ESTADOS_PROPIETARIO } from "../asesor/propietarios/constantes";
import { ETIQUETA_TIPO_EVENTO, EMOJI_TIPO_EVENTO } from "./agenda/constantes";
import { cn } from "@/lib/utils";
import { AccionesRapidas } from "@/components/inmobiliaria/acciones-rapidas";

const ETAPAS_EMBUDO = [
  { etapa: "nuevo_lead", label: "Leads", color: "bg-slate-700" },
  { etapa: "contactado", label: "Contactados", color: "bg-sky-500" },
  { etapa: "tasacion_programada", label: "Tasaciones", color: "bg-violet-500" },
  { etapa: "negociacion", label: "Negociación", color: "bg-amber-500" },
  { etapa: "exclusiva_firmada", label: "Exclusivas", color: "bg-emerald-500" },
  { etapa: "captado", label: "Captados", color: "bg-teal-500" },
] as const;

const ETIQUETA_OPORTUNIDAD: Record<string, string> = {
  nuevo_lead: "Primer contacto",
  contactado: "Seguir contacto",
  tasacion_programada: "Tasación pendiente",
  tasacion_realizada: "Enviar propuesta",
  negociacion: "Espera propuesta",
  exclusiva_firmada: "Cerrar captación",
};

const CUBETAS_CARTERA: { estados: string[]; label: string; color: string }[] = [
  { estados: ["captacion", "preparacion"], label: "Captación", color: "bg-slate-400" },
  { estados: ["publicado"], label: "Publicado", color: "bg-sky-500" },
  { estados: ["visitas", "oferta"], label: "En visitas", color: "bg-violet-500" },
  { estados: ["reservado"], label: "Reservado", color: "bg-amber-500" },
  { estados: ["vendido"], label: "Vendido", color: "bg-emerald-500" },
];

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

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Tendencia({ ok, texto }: { ok: boolean; texto: string }) {
  const Icono = ok ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
        ok ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
      )}
    >
      <Icono className="size-3" /> {texto}
    </span>
  );
}

export default async function InmobiliariaPage() {
  const { real, objetivo } = await obtenerImpersonacion();
  if (!real) redirect("/login");

  const usuario = objetivo ?? real;

  if (usuario.rol !== "admin") {
    return <InicioAsesor usuario={usuario} />;
  }

  return <CentroDeControl usuario={usuario} />;
}

async function InicioAsesor({ usuario }: { usuario: NonNullable<Awaited<ReturnType<typeof getUsuarioConTenant>>> }) {
  const supabase = await createClient();
  const tenantId = usuario.tenant_id;

  const ahora = new Date();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);

  const [
    { count: propietariosActivos },
    { count: compradoresActivos },
    { count: inmueblesActivos },
    { count: tareasPendientes },
    { data: eventosHoy },
    { data: tareasProximas },
    { data: propietariosPrioridad },
    { data: compradoresPrioridad },
  ] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("agente_id", usuario.id)
      .not("estado", "in", "(captado,perdido)"),
    supabase
      .from("compradores")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("agente_id", usuario.id)
      .not("estado", "in", "(comprado,perdido)"),
    // Los inmuebles son la cartera compartida de la inmobiliaria: se cuentan
    // todos, no solo los que este empleado tenga anotados como agente.
    supabase
      .from("inmuebles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .neq("estado", "vendido"),
    supabase
      .from("tareas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("asignado_a", usuario.id)
      .in("estado", ["pendiente", "en_progreso"]),
    supabase
      .from("eventos_agenda")
      .select("id, tipo, titulo, fecha_hora")
      .eq("tenant_id", tenantId)
      .eq("usuario_id", usuario.id)
      .eq("estado", "pendiente")
      .gte("fecha_hora", inicioHoy.toISOString())
      .lte("fecha_hora", finHoy.toISOString())
      .order("fecha_hora"),
    supabase
      .from("tareas")
      .select("id, titulo, fecha_vencimiento")
      .eq("tenant_id", tenantId)
      .eq("asignado_a", usuario.id)
      .in("estado", ["pendiente", "en_progreso"])
      .order("fecha_vencimiento", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from("propietarios")
      .select("id, nombre, estado, fecha_ultimo_contacto, fecha_proxima_accion, valor_estimado, fuente_lead")
      .eq("tenant_id", tenantId)
      .eq("agente_id", usuario.id)
      .not("estado", "in", "(captado,perdido)"),
    supabase
      .from("compradores")
      .select("id, nombre, estado, fecha_ultimo_contacto, fecha_proxima_accion, urgencia, presupuesto_max")
      .eq("tenant_id", tenantId)
      .eq("agente_id", usuario.id)
      .not("estado", "in", "(comprado,perdido)"),
  ]);

  const hora = ahora.getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";
  const primerNombre = (usuario.nombre_completo ?? usuario.email ?? "").split(" ")[0];

  const llamadasHoy = (eventosHoy ?? []).filter((e) => e.tipo === "llamada").length;
  const visitasHoy = (eventosHoy ?? []).filter((e) => e.tipo === "visita").length;

  const listaPropietarios = propietariosPrioridad ?? [];
  const listaCompradores = compradoresPrioridad ?? [];

  type ItemProximo = { id: string; href: string; icono: string; titulo: string; horaTexto: string; fecha: number };

  const eventosItems: ItemProximo[] = (eventosHoy ?? []).map((e) => ({
    id: e.id,
    href: `/inmobiliaria/agenda/${e.id}`,
    icono: EMOJI_TIPO_EVENTO[e.tipo] ?? "🔔",
    titulo: `${ETIQUETA_TIPO_EVENTO[e.tipo] ?? "Evento"} · ${e.titulo}`,
    horaTexto: new Date(e.fecha_hora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    fecha: new Date(e.fecha_hora).getTime(),
  }));

  const tareasItems: ItemProximo[] = (tareasProximas ?? []).map((t) => ({
    id: t.id,
    href: `/inmobiliaria/tareas/${t.id}`,
    icono: "📄",
    titulo: t.titulo,
    horaTexto: t.fecha_vencimiento
      ? new Date(t.fecha_vencimiento).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
      : "Sin fecha",
    fecha: t.fecha_vencimiento ? new Date(t.fecha_vencimiento).getTime() : Infinity,
  }));

  const proximas = [...eventosItems, ...tareasItems].sort((a, b) => a.fecha - b.fecha).slice(0, 5);
  const comenzarHref = proximas[0]?.href ?? "/inmobiliaria/mis-tareas";

  const propietarioUrgente = [...listaPropietarios]
    .filter((p) => calcularPrioridad(p) === "alta")
    .sort((a, b) => (diasDesde(b.fecha_ultimo_contacto) ?? 9999) - (diasDesde(a.fecha_ultimo_contacto) ?? 9999))[0];

  const compradorUrgente = [...listaCompradores]
    .filter((c) => calcularPrioridadComprador(c) === "alta")
    .sort((a, b) => (diasDesde(b.fecha_ultimo_contacto) ?? 9999) - (diasDesde(a.fecha_ultimo_contacto) ?? 9999))[0];

  const tareaVencida = (tareasProximas ?? []).find(
    (t) => t.fecha_vencimiento && estaVencida(t.fecha_vencimiento)
  );

  const prioridades = [
    propietarioUrgente && {
      id: `prop-${propietarioUrgente.id}`,
      href: `/inmobiliaria/propietarios/${propietarioUrgente.id}`,
      etiqueta: "Propietario",
      detalle: (() => {
        const dias = diasDesde(propietarioUrgente.fecha_ultimo_contacto);
        return dias === null ? "Sin contactar nunca" : `Hace ${dias} días sin contacto`;
      })(),
    },
    compradorUrgente && {
      id: `comp-${compradorUrgente.id}`,
      href: `/inmobiliaria/compradores/${compradorUrgente.id}`,
      etiqueta: "Comprador",
      detalle:
        compradorUrgente.estado === "visitas"
          ? "Esperando visita"
          : (() => {
              const dias = diasDesde(compradorUrgente.fecha_ultimo_contacto);
              return dias === null ? "Sin contactar nunca" : `Hace ${dias} días sin contacto`;
            })(),
    },
    tareaVencida && {
      id: `tarea-${tareaVencida.id}`,
      href: `/inmobiliaria/tareas/${tareaVencida.id}`,
      etiqueta: "Tarea vencida",
      detalle: tareaVencida.titulo,
    },
  ].filter(Boolean) as { id: string; href: string; etiqueta: string; detalle: string }[];

  // Colores fijos por categoría (mismo orden que el resto del CRM: violeta =
  // propietarios, esmeralda = compradores, cielo = inmuebles) para que el
  // donut y la leyenda sean consistentes en cualquier página.
  const cartera = [
    { label: "Propietarios", valor: propietariosActivos ?? 0, color: "#8b5cf6", clase: "bg-violet-500" },
    { label: "Compradores", valor: compradoresActivos ?? 0, color: "#10b981", clase: "bg-emerald-500" },
    { label: "Inmuebles", valor: inmueblesActivos ?? 0, color: "#0ea5e9", clase: "bg-sky-500" },
  ];
  const totalCartera = cartera.reduce((sum, c) => sum + c.valor, 0);
  let acumulado = 0;
  const donutCartera =
    totalCartera > 0
      ? cartera
          .map((c) => {
            const inicio = (acumulado / totalCartera) * 360;
            acumulado += c.valor;
            const fin = (acumulado / totalCartera) * 360;
            return `${c.color} ${inicio}deg ${fin}deg`;
          })
          .join(", ")
      : "var(--muted) 0deg 360deg";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Mi día</h1>

      <div className="rounded-2xl border bg-primary/5 p-6">
        <p className="text-lg font-medium">{saludo}, {primerNombre} 👋</p>
        <p className="mt-3 text-sm text-muted-foreground">Hoy tienes:</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
          <span>📞 <strong>{llamadasHoy}</strong> {llamadasHoy === 1 ? "llamada" : "llamadas"}</span>
          <span>🏡 <strong>{visitasHoy}</strong> {visitasHoy === 1 ? "visita" : "visitas"}</span>
          <span>✅ <strong>{tareasPendientes ?? 0}</strong> {(tareasPendientes ?? 0) === 1 ? "tarea" : "tareas"}</span>
        </div>
        <Link
          href={comenzarHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Comenzar <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-2xl border p-5 sm:flex-row">
        <div
          className="relative flex size-28 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${donutCartera})` }}
        >
          <div className="flex size-20 flex-col items-center justify-center rounded-full bg-background">
            <span className="text-xl font-semibold">{totalCartera}</span>
            <span className="text-[10px] text-muted-foreground">en tu cartera</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-1.5 text-sm">
          {cartera.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", c.clase)} />
              <span className="flex-1 text-muted-foreground">{c.label}</span>
              <span className="font-medium">{c.valor}</span>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
          <span className="flex size-14 items-center justify-center rounded-full bg-orange-500/10 text-xl font-semibold text-orange-600">
            {visitasHoy}
          </span>
          <span className="text-xs text-muted-foreground">Visitas hoy</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Próximas tareas</h2>
          {proximas.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" /> No tienes nada pendiente ahora mismo.
            </p>
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
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Prioridad alta</h2>
          {prioridades.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" /> Todo al día, no hay nada urgente.
            </p>
          ) : (
            <ul className="mt-2 divide-y">
              {prioridades.map((p) => (
                <li key={p.id} className="py-2 first:pt-0 last:pb-0">
                  <Link href={p.href} className="flex items-center gap-2 text-sm hover:underline">
                    <span>🔴</span>
                    <span>
                      <span className="font-medium">{p.etiqueta}</span>{" "}
                      <span className="text-muted-foreground">· {p.detalle}</span>
                    </span>
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

async function CentroDeControl({ usuario }: { usuario: NonNullable<Awaited<ReturnType<typeof getUsuarioConTenant>>> }) {
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
  const inicio30dias = new Date();
  inicio30dias.setDate(inicio30dias.getDate() - 30);

  const [
    { count: propietariosNuevosMes },
    { count: propietariosNuevosMesAnterior },
    { count: exclusivasMes },
    { count: inmueblesActivos },
    { count: compradoresActivos },
    { count: compradoresUrgentes },
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
    propietariosDocRequeridos,
    documentosExistentes,
    actividadesHoy,
    propietariosRecientes,
    compradoresParaSalud,
    inmueblesParaSelector,
    compradoresParaSelector,
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
      .from("compradores")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .not("estado", "in", "(comprado,perdido)")
      .eq("urgencia", "alta"),
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
      .select("id, contenido, usuario_id, creado_en")
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
    supabase
      .from("propietarios")
      .select("id")
      .eq("tenant_id", tenantId)
      .in("estado", ["tasacion_realizada", "negociacion", "exclusiva_firmada"]),
    supabase
      .from("documentos")
      .select("entidad_id")
      .eq("tenant_id", tenantId)
      .eq("entidad_tipo", "propietario"),
    supabase
      .from("actividades")
      .select("usuario_id")
      .eq("tenant_id", tenantId)
      .gte("creado_en", inicioHoy.toISOString())
      .lte("creado_en", finHoy.toISOString()),
    supabase
      .from("propietarios")
      .select("id, fecha_ultimo_contacto")
      .eq("tenant_id", tenantId)
      .gte("creado_en", inicio30dias.toISOString()),
    supabase
      .from("compradores")
      .select("id, fecha_proxima_accion")
      .eq("tenant_id", tenantId)
      .not("estado", "in", "(comprado,perdido)"),
    supabase.from("inmuebles").select("id, direccion").eq("tenant_id", tenantId).order("direccion"),
    supabase.from("compradores").select("id, nombre").eq("tenant_id", tenantId).order("nombre"),
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

  const leadsRecientes = propietariosRecientes.data ?? [];
  const ratioRespuesta =
    leadsRecientes.length > 0
      ? Math.round(
          (leadsRecientes.filter((p) => p.fecha_ultimo_contacto).length / leadsRecientes.length) * 100
        )
      : 100;
  const buenRatioRespuesta = ratioRespuesta >= 80;

  const compradoresSinSeguimiento = (compradoresParaSalud.data ?? []).filter(
    (c) => !c.fecha_proxima_accion
  ).length;

  const ritmoScore = ritmoSubio ? 100 : 50;
  const promedioSenales = Math.round((pctAlDia + ritmoScore + ratioRespuesta) / 3);
  const penalizacion = Math.min(20, sinContactoLargo * 3) + Math.min(20, compradoresSinSeguimiento * 3);
  const saludScore = Math.max(0, Math.min(100, promedioSenales - penalizacion));
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
  const maxCaptacionesMes = Math.max(1, ...captacionesPorMes);

  // --- Embudo de captación -------------------------------------------------
  const ordenEstado = ESTADOS_PROPIETARIO.reduce<Record<string, number>>((acc, e, i) => {
    acc[e] = i;
    return acc;
  }, {});
  const totalLeads = (propietariosParaEmbudo.data ?? []).filter((p) => p.estado !== "perdido").length;
  const embudo = ETAPAS_EMBUDO.map(({ etapa, label, color }) => ({
    etapa,
    label,
    color,
    valor: (propietariosParaEmbudo.data ?? []).filter(
      (p) => p.estado !== "perdido" && ordenEstado[p.estado] >= ordenEstado[etapa]
    ).length,
  }));
  const maxEmbudo = Math.max(1, embudo[0]?.valor ?? 1);
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
    total: cartera.length,
    vendidos: cartera.filter((i) => i.estado === "vendido").length,
    reservados: cartera.filter((i) => i.estado === "reservado").length,
    nuevos: cartera.filter((i) => new Date(i.creado_en) >= inicioMes).length,
  };
  const carteraSegmentos = CUBETAS_CARTERA.map((c) => ({
    ...c,
    valor: cartera.filter((i) => c.estados.includes(i.estado)).length,
  }));
  const carteraTotal = Math.max(1, carteraSegmentos.reduce((sum, s) => sum + s.valor, 0));

  // --- Atención requerida ------------------------------------------------
  const seguimientosVencidos = (propietariosSeguimiento.count ?? 0) + (compradoresSeguimiento.count ?? 0);

  const idsConDocumento = new Set((documentosExistentes.data ?? []).map((d) => d.entidad_id));
  const documentosPendientes = (propietariosDocRequeridos.data ?? []).filter(
    (p) => !idsConDocumento.has(p.id)
  ).length;

  const idsActivosHoy = new Set(
    (actividadesHoy.data ?? []).filter((a) => a.usuario_id).map((a) => a.usuario_id as string)
  );
  const asesoresSinActividad = (usuariosEquipo.data ?? []).filter(
    (u) => u.rol === "empleado" && !idsActivosHoy.has(u.id)
  ).length;

  const alertas = [
    seguimientosVencidos > 0 && { icono: "🔴", texto: `${seguimientosVencidos} seguimientos vencidos` },
    (tasacionesPendientes ?? 0) > 0 && { icono: "🟠", texto: `${tasacionesPendientes} tasaciones pendientes` },
    asesoresSinActividad > 0 && {
      icono: "🟡",
      texto: `${asesoresSinActividad} ${asesoresSinActividad === 1 ? "asesor" : "asesores"} sin actividad hoy`,
    },
    (propietariosNuevosMes ?? 0) > 0 && { icono: "🟢", texto: `${propietariosNuevosMes} nuevas captaciones` },
    documentosPendientes > 0 && { icono: "⚠️", texto: `${documentosPendientes} documentos pendientes` },
  ].filter(Boolean) as { icono: string; texto: string }[];

  // --- KPIs ------------------------------------------------------------
  const pctPropietarios =
    (propietariosNuevosMesAnterior ?? 0) > 0
      ? Math.round((((propietariosNuevosMes ?? 0) - (propietariosNuevosMesAnterior ?? 0)) / (propietariosNuevosMesAnterior ?? 1)) * 100)
      : (propietariosNuevosMes ?? 0) > 0
        ? 100
        : 0;

  const kpis = [
    {
      label: "Propietarios nuevos",
      valor: propietariosNuevosMes ?? 0,
      icono: UserPlus,
      badge: "bg-sky-500/10 text-sky-600",
      tendencia: <Tendencia ok={pctPropietarios >= 0} texto={`${pctPropietarios >= 0 ? "+" : ""}${pctPropietarios}% vs mes ant.`} />,
    },
    {
      label: "Exclusivas",
      valor: exclusivasMes ?? 0,
      icono: Award,
      badge: "bg-indigo-500/10 text-indigo-600",
      tendencia: (
        <Tendencia
          ok={(exclusivasMes ?? 0) >= objetivoExclusivas}
          texto={`Objetivo: ${objetivoExclusivas}`}
        />
      ),
    },
    {
      label: "Inmuebles activos",
      valor: inmueblesActivos ?? 0,
      icono: Home,
      badge: "bg-emerald-500/10 text-emerald-600",
      tendencia: <Tendencia ok texto={`${carteraStats.vendidos} vendidos`} />,
    },
    {
      label: "Compradores activos",
      valor: compradoresActivos ?? 0,
      icono: Users,
      badge: "bg-violet-500/10 text-violet-600",
      tendencia: <Tendencia ok texto={`${compradoresUrgentes ?? 0} urgentes`} />,
    },
    {
      label: "Seguimientos pendientes",
      valor: seguimientosVencidos,
      icono: Phone,
      badge: "bg-amber-500/10 text-amber-600",
      tendencia: <Tendencia ok={seguimientosVencidos === 0} texto={seguimientosVencidos === 0 ? "Al día" : "Requiere atención"} />,
    },
    {
      label: "Visitas de hoy",
      valor: visitasHoy ?? 0,
      icono: CalendarCheck,
      badge: "bg-orange-500/10 text-orange-600",
      tendencia: <Tendencia ok={(visitasHoy ?? 0) > 0} texto="Programadas hoy" />,
    },
  ];

  const hoyFormato = ahora.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hora = ahora.getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";
  const primerNombre = (usuario.nombre_completo ?? usuario.email ?? "").split(" ")[0];

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Centro de Control</h1>
          <p className="text-lg text-muted-foreground">
            {saludo}, {primerNombre}
          </p>
          <p className="text-sm text-muted-foreground/70 capitalize">{hoyFormato}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative flex size-10 items-center justify-center rounded-full border text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Bell className="size-4" />
            {alertas.length > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500" />
            )}
          </button>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {iniciales(usuario.nombre_completo ?? usuario.email ?? "") || "?"}
          </div>
        </div>
      </div>

      {/* Atención requerida */}
      <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">🎯 Atención requerida</h2>
        {alertas.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" /> Todo al día, no hay nada urgente ahora mismo.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
            {alertas.map((a) => (
              <span key={a.texto} className="flex items-center gap-2">
                <span>{a.icono}</span>
                <span>{a.texto}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Fila 1 — KPIs */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map(({ label, valor, icono: Icono, badge, tendencia }) => (
          <div key={label} className="flex flex-col gap-2 rounded-lg border p-3">
            <span className={cn("flex size-8 items-center justify-center rounded-lg", badge)}>
              <Icono className="size-4" />
            </span>
            <span className="text-2xl font-semibold">{valor}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
            {tendencia}
          </div>
        ))}
      </div>

      {/* Fila 2 — Salud comercial */}
      <div className="rounded-2xl border p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Salud Comercial</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className={`text-5xl font-semibold ${saludColor}`}>{saludScore}</span>
              <span className="text-base text-muted-foreground">/100</span>
            </p>
          </div>
          <span className={cn("rounded-full px-4 py-1.5 text-sm font-medium bg-current/10", saludColor)}>
            {saludLabel}
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-500/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
            style={{ width: `${saludScore}%` }}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              ok: pctAlDia >= 90,
              texto: pctAlDia >= 90 ? "Seguimientos al día" : `${pctAlDia}% de seguimientos al día`,
            },
            {
              ok: ritmoSubio,
              texto: ritmoSubio ? "Buen ritmo de captación" : "El ritmo de captación bajó",
            },
            {
              ok: buenRatioRespuesta,
              texto: buenRatioRespuesta ? "Buen ratio de respuesta" : `Ratio de respuesta bajo (${ratioRespuesta}%)`,
            },
            {
              ok: sinContactoLargo === 0,
              texto:
                sinContactoLargo === 0
                  ? "Nadie lleva +10 días sin contacto"
                  : `${sinContactoLargo} propietarios sin contacto +10 días`,
            },
            {
              ok: compradoresSinSeguimiento === 0,
              texto:
                compradoresSinSeguimiento === 0
                  ? "Compradores con seguimiento"
                  : `${compradoresSinSeguimiento} compradores sin seguimiento`,
            },
          ].map((s) => (
            <div
              key={s.texto}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3",
                s.ok ? "bg-emerald-500/8" : "bg-amber-500/8"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  s.ok ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                )}
              >
                {s.ok ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
              </span>
              <span className="text-xs leading-tight">{s.texto}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fila 3 — Captaciones + Exclusivas vs objetivo */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3 md:col-span-2">
          <h2 className="text-sm font-medium">Captaciones (últimos 6 meses)</h2>
          <div className="mt-3 space-y-1.5">
            {etiquetasMeses.map((etiqueta, i) => (
              <div key={etiqueta + i} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-xs text-muted-foreground capitalize">{etiqueta}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", i === etiquetasMeses.length - 1 ? "bg-foreground" : "bg-muted-foreground/40")}
                    style={{ width: `${(captacionesPorMes[i] / maxCaptacionesMes) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right text-xs font-medium">{captacionesPorMes[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Exclusivas este mes</h2>
          <div className="mt-2 flex items-center gap-4">
            <div
              className="flex size-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#6366f1 ${Math.min(100, ((exclusivasMes ?? 0) / Math.max(1, objetivoExclusivas)) * 100) * 3.6}deg, rgb(120 113 108 / 0.15) 0deg)`,
              }}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-background text-xs font-semibold">
                {exclusivasMes ?? 0}/{objetivoExclusivas}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold text-emerald-600">{exclusivasMes ?? 0}</span>{" "}
                <span className="text-muted-foreground">Conseguidas</span>
              </p>
              <p>
                <span className="font-semibold">{Math.max(0, objetivoExclusivas - (exclusivasMes ?? 0))}</span>{" "}
                <span className="text-muted-foreground">Faltan</span>
              </p>
              <p>
                <span className="font-semibold">{objetivoExclusivas}</span>{" "}
                <span className="text-muted-foreground">Objetivo</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fila 4 — Embudo + conversión */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3 md:col-span-2">
          <h2 className="text-sm font-medium">Embudo de captación</h2>
          <div className="mt-3 space-y-1.5">
            {embudo.map((e) => {
              const pct = Math.max(12, (e.valor / maxEmbudo) * 100);
              return (
                <div key={e.etapa} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{e.label}</span>
                  <div className="h-6 flex-1 rounded-md bg-muted">
                    <div
                      className={cn("flex h-full items-center justify-end rounded-md px-2", e.color)}
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-xs font-semibold text-white">{e.valor}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Conversión</h2>
          <div className="mt-2 flex flex-col items-center gap-2">
            <div
              className="flex size-20 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#10b981 ${conversion * 3.6}deg, rgb(120 113 108 / 0.15) 0deg)` }}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-background text-sm font-semibold">
                {conversion}%
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {captadosTotal} de {totalLeads} leads totales
            </p>
          </div>
          <div className="mt-3 space-y-1 border-t pt-2 text-xs">
            {embudo.slice(0, 3).map((e) => (
              <div key={e.etapa} className="flex items-center justify-between text-muted-foreground">
                <span>{e.label}</span>
                <span className="font-medium text-foreground">{e.valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila 5 — Ranking de asesores */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <Trophy className="size-4 text-amber-500" /> Ranking de asesores (este mes)
          </h2>
          <span className="text-xs text-muted-foreground/50">Ver informe →</span>
        </div>
        {ranking.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Todavía no hay exclusivas ni captaciones este mes.</p>
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
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarDays className="size-4" /> Agenda de hoy
          </h2>
          {(eventosHoy.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Sin visitas programadas hoy.</p>
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
          <ul className="mt-2 space-y-3">
            {(actividadReciente.data ?? []).map((a) => {
              const nombre = nombrePorUsuario.get(a.usuario_id ?? "") ?? "Alguien";
              return (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {iniciales(nombre) || "?"}
                  </span>
                  <span className="flex-1">
                    <span className="font-medium">{nombre}</span> {a.contenido}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativo(a.creado_en)}</span>
                </li>
              );
            })}
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
      <div className="rounded-lg border p-3">
        <h2 className="text-sm font-medium">Rendimiento de la cartera</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div>
            <p className="text-xl font-semibold">{carteraStats.total}</p>
            <p className="text-xs text-muted-foreground">Total inmuebles</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-emerald-600">{carteraStats.vendidos}</p>
            <p className="text-xs text-muted-foreground">Vendidos</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-amber-600">{carteraStats.reservados}</p>
            <p className="text-xs text-muted-foreground">Reservados</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-violet-600">{carteraStats.nuevos}</p>
            <p className="text-xs text-muted-foreground">Nuevos este mes</p>
          </div>
        </div>
        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
          {carteraSegmentos.map((s) => (
            <div
              key={s.label}
              className={s.color}
              style={{ width: `${(s.valor / carteraTotal) * 100}%` }}
              title={`${s.label}: ${s.valor}`}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {carteraSegmentos.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn("size-2 rounded-full", s.color)} /> {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Fila 10 — Acciones rápidas */}
      <div className="rounded-lg border p-3">
        <h2 className="text-sm font-medium">Acciones rápidas</h2>
        <div className="mt-3">
          <AccionesRapidas
            inmuebles={(inmueblesParaSelector.data ?? []).map((i) => ({ id: i.id, etiqueta: i.direccion }))}
            compradores={(compradoresParaSelector.data ?? []).map((c) => ({ id: c.id, etiqueta: c.nombre }))}
            asesores={(usuariosEquipo.data ?? []).map((a) => ({ id: a.id, etiqueta: a.nombre_completo }))}
          />
        </div>
      </div>
    </div>
  );
}
