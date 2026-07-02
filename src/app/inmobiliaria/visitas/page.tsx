import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NuevaVisitaForm } from "./nueva-visita-form";
import { FilaVisita } from "./fila-visita";
import { CalendarDays, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function VisitasPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();

  let query = supabase
    .from("eventos_agenda")
    .select("id, titulo, descripcion, fecha_hora, estado, confirmado, resultado, nota_resultado, entidad_tipo, entidad_id, usuario_id")
    .eq("tenant_id", usuario.tenant_id)
    .eq("tipo", "visita")
    .order("fecha_hora", { ascending: false });

  if (!gestor) query = query.eq("usuario_id", usuario.id);

  const { data } = await query;
  const visitas = data ?? [];

  const inmuebleIds = [...new Set(visitas.filter(v => v.entidad_tipo === "inmueble").map(v => v.entidad_id).filter(Boolean))];
  const propietarioIds = [...new Set(visitas.filter(v => v.entidad_tipo === "propietario").map(v => v.entidad_id).filter(Boolean))];

  const [{ data: inmuebles }, { data: propietarios }, { data: usuariosData }] = await Promise.all([
    inmuebleIds.length
      ? supabase.from("inmuebles").select("id, direccion").in("id", inmuebleIds)
      : Promise.resolve({ data: [] }),
    propietarioIds.length
      ? supabase.from("propietarios").select("id, nombre").in("id", propietarioIds)
      : Promise.resolve({ data: [] }),
    supabase.from("usuarios").select("id, nombre_completo").eq("tenant_id", usuario.tenant_id).eq("activo", true),
  ]);

  const nombreInmueble = new Map((inmuebles ?? []).map(i => [i.id, i.direccion]));
  const nombrePropietario = new Map((propietarios ?? []).map(p => [p.id, p.nombre]));
  const nombreAgente = new Map((usuariosData ?? []).map(u => [u.id, u.nombre_completo]));

  // KPIs
  const ahora = new Date();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const finSemana = new Date(hoy); finSemana.setDate(hoy.getDate() + 7);

  const visitasHoy = visitas.filter(v => {
    const f = new Date(v.fecha_hora); f.setHours(0, 0, 0, 0);
    return f.getTime() === hoy.getTime() && v.estado === "pendiente";
  }).length;
  const estaSemana = visitas.filter(v => {
    const f = new Date(v.fecha_hora);
    return f >= hoy && f <= finSemana && v.estado === "pendiente";
  }).length;
  const pendientes = visitas.filter(v => v.estado === "pendiente").length;
  const confirmadas = visitas.filter(v => v.estado === "pendiente" && v.confirmado).length;
  const realizadas = visitas.filter(v => v.estado === "completado").length;
  const canceladas = visitas.filter(v => v.estado === "cancelado").length;

  const kpis = [
    { label: "Hoy", value: visitasHoy, color: "text-primary" },
    { label: "Esta semana", value: estaSemana, color: "text-blue-600" },
    { label: "Pendientes", value: pendientes, color: "text-amber-600" },
    { label: "Confirmadas", value: confirmadas, color: "text-emerald-600" },
    { label: "Realizadas", value: realizadas, color: "text-muted-foreground" },
    { label: "Canceladas", value: canceladas, color: "text-rose-600" },
  ];

  const pendientesData = visitas.filter(v => v.estado === "pendiente")
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());
  const completadasData = visitas.filter(v => v.estado === "completado");

  function getNombreEntidad(v: typeof visitas[0]) {
    if (v.entidad_tipo === "inmueble") return nombreInmueble.get(v.entidad_id ?? "") ?? null;
    if (v.entidad_tipo === "propietario") return nombrePropietario.get(v.entidad_id ?? "") ?? null;
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Visitas</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-3 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Nueva visita */}
      <NuevaVisitaForm />

      {/* Pendientes */}
      {pendientesData.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Clock className="size-4 text-amber-500" />
            Próximas visitas
          </h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {pendientesData.map((v) => (
              <FilaVisita key={v.id} visita={v} nombreEntidad={getNombreEntidad(v)} />
            ))}
          </div>
        </section>
      )}

      {/* Realizadas */}
      {completadasData.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Visitas realizadas
          </h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {completadasData.map((v) => (
              <FilaVisita key={v.id} visita={v} nombreEntidad={getNombreEntidad(v)} />
            ))}
          </div>
        </section>
      )}

      {visitas.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <CalendarDays className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">No hay visitas registradas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Programa tu primera visita usando el formulario de arriba.
          </p>
        </div>
      )}
    </div>
  );
}
