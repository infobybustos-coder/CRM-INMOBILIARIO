import {
  CalendarClock,
  CalendarRange,
  Clock,
  CheckCircle2,
  CheckCheck,
  XCircle,
  AlertTriangle,
  Flame,
  Users,
  Info,
} from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarioMensual } from "@/components/asesor/calendario-mensual";
import { VistaSwitcher } from "@/components/inmobiliaria/agenda/vista-switcher";
import { Tabla as TablaAgenda, type EventoFila } from "@/components/inmobiliaria/agenda/tabla";
import { Tabla as TablaTareas, type TareaFila } from "@/components/inmobiliaria/tareas/tabla";
import { FiltroDia } from "@/components/inmobiliaria/seguimiento/filtro-dia";
import { agruparPorDia, type AgendaItem } from "@/lib/agenda";
import { ETIQUETA_TIPO_EVENTO } from "../agenda/constantes";

const RUTA_ENTIDAD: Record<string, string> = {
  propietario: "/inmobiliaria/propietarios",
  comprador: "/inmobiliaria/compradores",
  inmueble: "/inmobiliaria/inmuebles",
};

function inicioDeSemana(fecha: Date) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay();
  const diff = (dia + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function aISO(fecha: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function esMismoDia(fechaISO: string | null, diaISO: string) {
  if (!fechaISO) return false;
  return aISO(new Date(fechaISO)) === diaISO;
}

export default async function SeguimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; dia?: string }>;
}) {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();
  const { vista: vistaParam, dia: diaParam } = await searchParams;
  const vista = vistaParam === "calendario" ? "calendario" : "lista";
  const dia = diaParam ?? aISO(new Date());
  const filtrandoPorDia = dia !== "todos";

  const ahora = new Date();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const inicioSemana = inicioDeSemana(ahora);
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(finSemana.getDate() + 7);

  const [
    { data: eventos, error: errorEventos },
    { data: tareas, error: errorTareas },
  ] = await Promise.all([
    supabase
      .from("eventos_agenda")
      .select(
        "id, tipo, fecha_hora, estado, confirmado, usuario_id, entidad_tipo, entidad_id, inmueble_id, comprador_id"
      )
      .eq("tenant_id", usuario.tenant_id)
      .order("fecha_hora", { ascending: true }),
    supabase
      .from("tareas")
      .select(
        "id, titulo, descripcion, fecha_vencimiento, estado, prioridad, asignado_a, entidad_tipo, entidad_id, creado_en"
      )
      .eq("tenant_id", usuario.tenant_id)
      .order("fecha_vencimiento", { ascending: true, nullsFirst: false }),
  ]);

  const idsPorTipo: Record<string, Set<string>> = {
    propietario: new Set(),
    comprador: new Set(),
    inmueble: new Set(),
  };
  for (const e of eventos ?? []) {
    if (e.entidad_tipo && idsPorTipo[e.entidad_tipo]) idsPorTipo[e.entidad_tipo].add(e.entidad_id);
    if (e.inmueble_id) idsPorTipo.inmueble.add(e.inmueble_id);
    if (e.comprador_id) idsPorTipo.comprador.add(e.comprador_id);
  }
  for (const t of tareas ?? []) {
    if (t.entidad_tipo && idsPorTipo[t.entidad_tipo]) idsPorTipo[t.entidad_tipo].add(t.entidad_id);
  }

  const [propietarios, compradores, inmuebles, usuarios] = await Promise.all([
    idsPorTipo.propietario.size
      ? supabase.from("propietarios").select("id, nombre").in("id", [...idsPorTipo.propietario])
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    idsPorTipo.comprador.size
      ? supabase.from("compradores").select("id, nombre").in("id", [...idsPorTipo.comprador])
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    idsPorTipo.inmueble.size
      ? supabase.from("inmuebles").select("id, direccion").in("id", [...idsPorTipo.inmueble])
      : Promise.resolve({ data: [] as { id: string; direccion: string }[] }),
    supabase
      .from("usuarios")
      .select("id, nombre_completo")
      .eq("tenant_id", usuario.tenant_id)
      .order("nombre_completo"),
  ]);

  const nombrePropietario = new Map((propietarios.data ?? []).map((p) => [p.id, p.nombre as string]));
  const nombreComprador = new Map((compradores.data ?? []).map((c) => [c.id, c.nombre as string]));
  const direccionInmueble = new Map((inmuebles.data ?? []).map((i) => [i.id, i.direccion as string]));
  const nombreUsuario = new Map((usuarios.data ?? []).map((a) => [a.id, a.nombre_completo as string]));

  function resolverRelacionadoEvento(e: NonNullable<typeof eventos>[number]) {
    if (e.tipo === "visita" && (e.inmueble_id || e.comprador_id)) {
      const direccion = direccionInmueble.get(e.inmueble_id ?? "") ?? "Inmueble sin especificar";
      const comprador = nombreComprador.get(e.comprador_id ?? "") ?? "Comprador sin especificar";
      return {
        relacionadoCon: `${direccion} · ${comprador}`,
        hrefRelacionado: e.inmueble_id ? `${RUTA_ENTIDAD.inmueble}/${e.inmueble_id}` : null,
      };
    }
    if (e.entidad_tipo === "propietario") {
      return {
        relacionadoCon: nombrePropietario.get(e.entidad_id) ?? null,
        hrefRelacionado: `${RUTA_ENTIDAD.propietario}/${e.entidad_id}`,
      };
    }
    if (e.entidad_tipo === "comprador") {
      return {
        relacionadoCon: nombreComprador.get(e.entidad_id) ?? null,
        hrefRelacionado: `${RUTA_ENTIDAD.comprador}/${e.entidad_id}`,
      };
    }
    if (e.entidad_tipo === "inmueble") {
      return {
        relacionadoCon: direccionInmueble.get(e.entidad_id) ?? null,
        hrefRelacionado: `${RUTA_ENTIDAD.inmueble}/${e.entidad_id}`,
      };
    }
    return { relacionadoCon: null, hrefRelacionado: null };
  }

  function resolverRelacionadoTarea(t: NonNullable<typeof tareas>[number]) {
    if (t.entidad_tipo === "propietario") {
      return {
        relacionadoCon: nombrePropietario.get(t.entidad_id) ?? null,
        hrefRelacionado: `${RUTA_ENTIDAD.propietario}/${t.entidad_id}`,
      };
    }
    if (t.entidad_tipo === "comprador") {
      return {
        relacionadoCon: nombreComprador.get(t.entidad_id) ?? null,
        hrefRelacionado: `${RUTA_ENTIDAD.comprador}/${t.entidad_id}`,
      };
    }
    if (t.entidad_tipo === "inmueble") {
      return {
        relacionadoCon: direccionInmueble.get(t.entidad_id) ?? null,
        hrefRelacionado: `${RUTA_ENTIDAD.inmueble}/${t.entidad_id}`,
      };
    }
    return { relacionadoCon: null, hrefRelacionado: null };
  }

  const eventosDelDia = filtrandoPorDia
    ? (eventos ?? []).filter((e) => esMismoDia(e.fecha_hora, dia))
    : (eventos ?? []);
  const tareasDelDia = filtrandoPorDia
    ? (tareas ?? []).filter((t) => esMismoDia(t.fecha_vencimiento, dia))
    : (tareas ?? []);

  const filasAgenda: EventoFila[] = eventosDelDia.map((e) => {
    const { relacionadoCon, hrefRelacionado } = resolverRelacionadoEvento(e);
    return {
      id: e.id,
      tipo: e.tipo,
      fecha_hora: e.fecha_hora,
      estado: e.estado,
      confirmado: e.confirmado,
      relacionadoCon,
      hrefRelacionado,
      nombreAsesor: nombreUsuario.get(e.usuario_id ?? "") ?? null,
    };
  });

  const filasTareas: TareaFila[] = tareasDelDia.map((t) => {
    const { relacionadoCon, hrefRelacionado } = resolverRelacionadoTarea(t);
    return {
      id: t.id,
      titulo: t.titulo,
      prioridad: t.prioridad,
      estado: t.estado,
      fecha_vencimiento: t.fecha_vencimiento,
      entidadTipo: t.entidad_tipo,
      relacionadoCon,
      hrefRelacionado,
      nombreResponsable: nombreUsuario.get(t.asignado_a ?? "") ?? null,
    };
  });

  const kpisAgenda = [
    {
      label: "Hoy",
      valor: (eventos ?? []).filter(
        (e) => new Date(e.fecha_hora) >= inicioHoy && new Date(e.fecha_hora) <= finHoy
      ).length,
      icono: CalendarClock,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Esta semana",
      valor: (eventos ?? []).filter(
        (e) => new Date(e.fecha_hora) >= inicioSemana && new Date(e.fecha_hora) < finSemana
      ).length,
      icono: CalendarRange,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Pendientes",
      valor: (eventos ?? []).filter((e) => e.estado === "pendiente").length,
      icono: Clock,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Confirmadas",
      valor: (eventos ?? []).filter((e) => e.estado === "pendiente" && e.confirmado).length,
      icono: CheckCircle2,
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      label: "Realizadas",
      valor: (eventos ?? []).filter((e) => e.estado === "completado").length,
      icono: CheckCheck,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Canceladas",
      valor: (eventos ?? []).filter((e) => e.estado === "cancelado").length,
      icono: XCircle,
      color: "bg-rose-500/10 text-rose-600",
    },
  ];

  const tareasActivas = (tareas ?? []).filter((t) => t.estado === "pendiente" || t.estado === "en_progreso");

  const kpisTareas = [
    {
      label: "Pendientes",
      valor: tareasActivas.length,
      icono: Clock,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Para hoy",
      valor: tareasActivas.filter(
        (t) =>
          t.fecha_vencimiento &&
          new Date(t.fecha_vencimiento) >= inicioHoy &&
          new Date(t.fecha_vencimiento) <= finHoy
      ).length,
      icono: CalendarClock,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Vencidas",
      valor: tareasActivas.filter((t) => t.fecha_vencimiento && new Date(t.fecha_vencimiento) < inicioHoy)
        .length,
      icono: AlertTriangle,
      color: "bg-red-500/10 text-red-600",
    },
    {
      label: "Completadas",
      valor: (tareas ?? []).filter((t) => t.estado === "completada").length,
      icono: CheckCheck,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Alta prioridad",
      valor: tareasActivas.filter((t) => t.prioridad === "alta").length,
      icono: Flame,
      color: "bg-rose-500/10 text-rose-600",
    },
    {
      label: "Asignadas",
      valor: tareasActivas.filter((t) => t.asignado_a).length,
      icono: Users,
      color: "bg-violet-500/10 text-violet-600",
    },
  ];

  const agendaItems: AgendaItem[] = (eventos ?? []).map((e) => {
    const { relacionadoCon } = resolverRelacionadoEvento(e);
    return {
      id: e.id,
      origen: "evento" as const,
      titulo: `${ETIQUETA_TIPO_EVENTO[e.tipo] ?? e.tipo}${relacionadoCon ? ` · ${relacionadoCon}` : ""}`,
      fecha: e.fecha_hora,
      estado: e.estado,
      tipo: e.tipo,
    };
  });
  const agendaPorDia = agruparPorDia(agendaItems);
  const ahoraMesInicial = { year: ahora.getFullYear(), month: ahora.getMonth() };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FiltroDia dia={dia} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:divide-x lg:divide-border">
        {/* Columna Agenda */}
        <section className="space-y-4 lg:pr-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-1.5 text-lg font-semibold">📅 Agenda</h2>
            <VistaSwitcher vista={vista} />
          </div>

          {errorEventos && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
              <p className="font-medium">No se pudieron cargar los eventos de la agenda.</p>
              <p className="mt-1 text-xs">{errorEventos.message}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {kpisAgenda.map(({ label, valor, icono: Icono, color }) => (
              <div key={label} className="flex flex-col gap-2 rounded-xl border p-3">
                <span className={`flex size-8 items-center justify-center rounded-lg ${color}`}>
                  <Icono className="size-4" />
                </span>
                <span className="text-xl font-semibold">{valor}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {vista === "calendario" ? (
            <CalendarioMensual itemsPorDia={agendaPorDia} mesInicial={ahoraMesInicial} />
          ) : (
            <TablaAgenda eventos={filasAgenda} />
          )}
        </section>

        {/* Columna Tareas */}
        <section className="space-y-4 lg:pl-6">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold">✅ Tareas</h2>

          {errorTareas && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
              <p className="font-medium">No se pudieron cargar las tareas.</p>
              <p className="mt-1 text-xs">
                {errorTareas.message}
                {errorTareas.message?.includes("column") &&
                  " — probablemente falta correr la migración 0016_tareas_prioridad.sql en Supabase."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {kpisTareas.map(({ label, valor, icono: Icono, color }) => (
              <div key={label} className="flex flex-col gap-2 rounded-xl border p-3">
                <span className={`flex size-8 items-center justify-center rounded-lg ${color}`}>
                  <Icono className="size-4" />
                </span>
                <span className="text-xl font-semibold">{valor}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
            <p>
              Las tareas no se crean desde aquí: nacen automáticamente desde la ficha de un
              Propietario, Comprador o Inmueble.
            </p>
          </div>

          <TablaTareas tareas={filasTareas} />
        </section>
      </div>
    </div>
  );
}
