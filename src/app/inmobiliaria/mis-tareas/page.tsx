import { Clock, CalendarClock, AlertTriangle, CheckCheck, Flame } from "lucide-react";
import { requireInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabla, type TareaFila } from "@/components/inmobiliaria/tareas/tabla";

const RUTA_ENTIDAD: Record<string, string> = {
  propietario: "/inmobiliaria/propietarios",
  comprador: "/inmobiliaria/compradores",
  inmueble: "/inmobiliaria/inmuebles",
};

export default async function MisTareasPage() {
  const usuario = await requireInmobiliaria();
  const supabase = await createClient();

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);

  const { data: tareas, error: errorTareas } = await supabase
    .from("tareas")
    .select(
      "id, titulo, descripcion, fecha_vencimiento, estado, prioridad, entidad_tipo, entidad_id, creado_en"
    )
    .eq("tenant_id", usuario.tenant_id)
    .eq("asignado_a", usuario.id)
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false });

  const idsPorTipo: Record<string, Set<string>> = {
    propietario: new Set(),
    comprador: new Set(),
    inmueble: new Set(),
  };
  for (const t of tareas ?? []) {
    if (t.entidad_tipo && idsPorTipo[t.entidad_tipo]) idsPorTipo[t.entidad_tipo].add(t.entidad_id);
  }

  const [{ data: propietarios }, { data: compradores }, { data: inmuebles }] = await Promise.all([
    idsPorTipo.propietario.size
      ? supabase.from("propietarios").select("id, nombre").in("id", [...idsPorTipo.propietario])
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    idsPorTipo.comprador.size
      ? supabase.from("compradores").select("id, nombre").in("id", [...idsPorTipo.comprador])
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    idsPorTipo.inmueble.size
      ? supabase.from("inmuebles").select("id, direccion").in("id", [...idsPorTipo.inmueble])
      : Promise.resolve({ data: [] as { id: string; direccion: string }[] }),
  ]);

  const nombrePropietario = new Map((propietarios ?? []).map((p) => [p.id, p.nombre as string]));
  const nombreComprador = new Map((compradores ?? []).map((c) => [c.id, c.nombre as string]));
  const direccionInmueble = new Map((inmuebles ?? []).map((i) => [i.id, i.direccion as string]));

  function resolverRelacionado(t: NonNullable<typeof tareas>[number]) {
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

  const filas: TareaFila[] = (tareas ?? []).map((t) => {
    const { relacionadoCon, hrefRelacionado } = resolverRelacionado(t);
    return {
      id: t.id,
      titulo: t.titulo,
      prioridad: t.prioridad,
      estado: t.estado,
      fecha_vencimiento: t.fecha_vencimiento,
      entidadTipo: t.entidad_tipo,
      relacionadoCon,
      hrefRelacionado,
      nombreResponsable: usuario.nombre_completo,
    };
  });

  const activas = (tareas ?? []).filter((t) => t.estado === "pendiente" || t.estado === "en_progreso");

  const kpis = [
    {
      label: "Pendientes",
      valor: activas.length,
      icono: Clock,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Para hoy",
      valor: activas.filter(
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
      valor: activas.filter((t) => t.fecha_vencimiento && new Date(t.fecha_vencimiento) < inicioHoy)
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
      valor: activas.filter((t) => t.prioridad === "alta").length,
      icono: Flame,
      color: "bg-rose-500/10 text-rose-600",
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Tareas</h1>

      {errorTareas && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
          <p className="font-medium">No se pudieron cargar tus tareas.</p>
          <p className="mt-1 text-xs">{errorTareas.message}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
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

      <Tabla tareas={filas} />
    </div>
  );
}
