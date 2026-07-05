import { CalendarClock, CalendarRange, Clock, CheckCircle2, CheckCheck, XCircle } from "lucide-react";
import { requireInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarioMensual } from "@/components/asesor/calendario-mensual";
import { Tabla, type VisitaFila } from "@/components/inmobiliaria/visitas/tabla";
import { NuevaVisita } from "@/components/inmobiliaria/visitas/nueva-visita";
import { agruparPorDia, type AgendaItem } from "@/lib/agenda";

function inicioDeSemana(fecha: Date) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay();
  const diff = (dia + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export default async function MisVisitasPage() {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

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
    { data: inmuebles },
    { data: compradores },
  ] = await Promise.all([
      supabase
        .from("eventos_agenda")
        .select("id, fecha_hora, estado, confirmado, inmueble_id, comprador_id, usuario_id, creado_en")
        .eq("tenant_id", usuario.tenant_id)
        .eq("tipo", "visita")
        .eq("usuario_id", usuario.id)
        .order("fecha_hora", { ascending: true }),
      supabase
        .from("inmuebles")
        .select("id, direccion")
        .eq("tenant_id", usuario.tenant_id)
        .order("direccion"),
      supabase
        .from("compradores")
        .select("id, nombre")
        .eq("tenant_id", usuario.tenant_id)
        .order("nombre"),
    ]);

  const inmueblesPorId = new Map((inmuebles ?? []).map((i) => [i.id, i.direccion as string]));
  const compradoresPorId = new Map((compradores ?? []).map((c) => [c.id, c.nombre as string]));
  const asesoresPorId = new Map([[usuario.id, usuario.nombre_completo as string]]);

  const visitas: VisitaFila[] = (eventos ?? []).map((e) => ({
    id: e.id,
    fecha_hora: e.fecha_hora,
    estado: e.estado,
    confirmado: e.confirmado,
    direccionInmueble: inmueblesPorId.get(e.inmueble_id ?? "") ?? "Inmueble sin especificar",
    nombreComprador: compradoresPorId.get(e.comprador_id ?? "") ?? "Comprador sin especificar",
    nombreAsesor: asesoresPorId.get(e.usuario_id ?? "") ?? null,
  }));

  const ultimasCreadas: VisitaFila[] = [...(eventos ?? [])]
    .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      fecha_hora: e.fecha_hora,
      estado: e.estado,
      confirmado: e.confirmado,
      direccionInmueble: inmueblesPorId.get(e.inmueble_id ?? "") ?? "Inmueble sin especificar",
      nombreComprador: compradoresPorId.get(e.comprador_id ?? "") ?? "Comprador sin especificar",
      nombreAsesor: asesoresPorId.get(e.usuario_id ?? "") ?? null,
    }));

  const proximaPendiente = (eventos ?? [])
    .filter((e) => e.estado === "pendiente" && new Date(e.fecha_hora) >= inicioHoy)
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())[0];
  const fechaMesCalendario = proximaPendiente ? new Date(proximaPendiente.fecha_hora) : ahora;
  const mesInicialCalendario = {
    year: fechaMesCalendario.getFullYear(),
    month: fechaMesCalendario.getMonth(),
  };

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

  const agendaItems: AgendaItem[] = (eventos ?? []).map((e) => ({
    id: e.id,
    origen: "evento" as const,
    titulo: `${inmueblesPorId.get(e.inmueble_id ?? "") ?? "Visita"} · ${compradoresPorId.get(e.comprador_id ?? "") ?? ""}`,
    fecha: e.fecha_hora,
    estado: e.estado,
    tipo: "visita",
  }));
  const agendaPorDia = agruparPorDia(agendaItems);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis visitas</h1>
        <NuevaVisita
          inmuebles={(inmuebles ?? []).map((i) => ({ id: i.id, etiqueta: i.direccion }))}
          compradores={(compradores ?? []).map((c) => ({ id: c.id, etiqueta: c.nombre }))}
          asesores={[{ id: usuario.id, etiqueta: usuario.nombre_completo }]}
        />
      </div>

      {errorEventos && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
          <p className="font-medium">No se pudieron cargar las visitas.</p>
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-5">
          <Tabla visitas={visitas} />
        </div>
        <div className="space-y-4">
          <CalendarioMensual itemsPorDia={agendaPorDia} mesInicial={mesInicialCalendario} />

          <div className="rounded-lg border p-3">
            <h2 className="text-sm font-medium">Últimas visitas creadas</h2>
            {ultimasCreadas.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Todavía no se ha creado ninguna.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {ultimasCreadas.map((v) => (
                  <li key={v.id} className="text-sm">
                    <p className="font-medium">{v.direccionInmueble}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.nombreComprador} ·{" "}
                      {new Date(v.fecha_hora).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      {new Date(v.fecha_hora).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
