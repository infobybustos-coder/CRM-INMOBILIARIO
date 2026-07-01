import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NuevaVisitaForm } from "./nueva-visita-form";
import { FilaVisita } from "./fila-visita";
import { CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";

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

  // Load inmueble/propietario names for context
  const inmuebleIds = [...new Set(visitas.filter(v => v.entidad_tipo === "inmueble").map(v => v.entidad_id).filter(Boolean))];
  const propietarioIds = [...new Set(visitas.filter(v => v.entidad_tipo === "propietario").map(v => v.entidad_id).filter(Boolean))];

  const [{ data: inmuebles }, { data: propietarios }] = await Promise.all([
    inmuebleIds.length
      ? supabase.from("inmuebles").select("id, direccion").in("id", inmuebleIds)
      : Promise.resolve({ data: [] }),
    propietarioIds.length
      ? supabase.from("propietarios").select("id, nombre").in("id", propietarioIds)
      : Promise.resolve({ data: [] }),
  ]);

  const nombreInmueble = new Map((inmuebles ?? []).map(i => [i.id, i.direccion]));
  const nombrePropietario = new Map((propietarios ?? []).map(p => [p.id, p.nombre]));

  const pendientes = visitas.filter(v => v.estado === "pendiente");
  const completadas = visitas.filter(v => v.estado === "completado");
  const canceladas = visitas.filter(v => v.estado === "cancelado");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Visitas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Calendario de visitas, confirmaciones y resultados
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pendientes", value: pendientes.length, icon: Clock, color: "text-amber-500" },
          { label: "Completadas", value: completadas.length, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Canceladas", value: canceladas.length, icon: XCircle, color: "text-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center">
            <Icon className={`mx-auto mb-1 size-5 ${color}`} />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* New visit form */}
      <NuevaVisitaForm />

      {/* Pending visits */}
      {pendientes.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Clock className="size-4 text-amber-500" />
            Próximas visitas
          </h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {pendientes.map((v) => (
              <FilaVisita
                key={v.id}
                visita={v}
                nombreEntidad={
                  v.entidad_tipo === "inmueble"
                    ? (nombreInmueble.get(v.entidad_id ?? "") ?? null)
                    : v.entidad_tipo === "propietario"
                    ? (nombrePropietario.get(v.entidad_id ?? "") ?? null)
                    : null
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed visits */}
      {completadas.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Visitas realizadas
          </h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {completadas.map((v) => (
              <FilaVisita
                key={v.id}
                visita={v}
                nombreEntidad={
                  v.entidad_tipo === "inmueble"
                    ? (nombreInmueble.get(v.entidad_id ?? "") ?? null)
                    : v.entidad_tipo === "propietario"
                    ? (nombrePropietario.get(v.entidad_id ?? "") ?? null)
                    : null
                }
              />
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
