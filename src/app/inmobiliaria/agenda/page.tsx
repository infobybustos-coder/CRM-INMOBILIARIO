import { CalendarClock, CalendarRange, Clock, CheckCircle2, CheckCheck, XCircle } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarioMensual } from "@/components/asesor/calendario-mensual";
import { VistaSwitcher } from "@/components/inmobiliaria/agenda/vista-switcher";
import { Tabla, type EventoFila } from "@/components/inmobiliaria/agenda/tabla";
import { agruparPorDia, type AgendaItem } from "@/lib/agenda";
import { ETIQUETA_TIPO_EVENTO } from "./constantes";

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

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();
  const { vista: vistaParam } = await searchParams;
  const vista = vistaParam === "calendario" ? "calendario" : "lista";

  const ahora = new Date();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const inicioSemana = inicioDeSemana(ahora);
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(finSemana.getDate() + 7);

  const { data: eventos, error: errorEventos } = await supabase
    .from("eventos_agenda")
    .select(
      "id, tipo, fecha_hora, estado, confirmado, usuario_id, entidad_tipo, entidad_id, inmueble_id, comprador_id"
    )
    .eq("tenant_id", usuario.tenant_id)
    .order("fecha_hora", { ascending: true });

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

  const [propietarios, compradores, inmuebles, asesores] = await Promise.all([
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
  const nombreAsesor = new Map((asesores.data ?? []).map((a) => [a.id, a.nombre_completo as string]));

  function resolverRelacionado(e: NonNullable<typeof eventos>[number]) {
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

  const filas: EventoFila[] = (eventos ?? []).map((e) => {
    const { relacionadoCon, hrefRelacionado } = resolverRelacionado(e);
    return {
      id: e.id,
      tipo: e.tipo,
      fecha_hora: e.fecha_hora,
      estado: e.estado,
      confirmado: e.confirmado,
      relacionadoCon,
      hrefRelacionado,
      nombreAsesor: nombreAsesor.get(e.usuario_id ?? "") ?? null,
    };
  });

  const kpis = [
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

  const agendaItems: AgendaItem[] = (eventos ?? []).map((e) => {
    const { relacionadoCon } = resolverRelacionado(e);
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <VistaSwitcher vista={vista} />
      </div>

      {errorEventos && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
          <p className="font-medium">No se pudieron cargar los eventos de la agenda.</p>
          <p className="mt-1 text-xs">{errorEventos.message}</p>
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

      {vista === "calendario" ? (
        <CalendarioMensual itemsPorDia={agendaPorDia} mesInicial={ahoraMesInicial} />
      ) : (
        <Tabla eventos={filas} />
      )}
    </div>
  );
}
