import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NuevaVisitaForm } from "./nueva-visita-form";
import { FilaVisita } from "./fila-visita";
import { CalendarDays } from "lucide-react";
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
    .order("fecha_hora", { ascending: true });

  if (!gestor) query = query.eq("usuario_id", usuario.id);

  const { data } = await query;
  const visitas = data ?? [];

  // Cargar entidades relacionadas
  const inmuebleIds = [...new Set(visitas.filter(v => v.entidad_tipo === "inmueble" && v.entidad_id).map(v => v.entidad_id!))];
  const usuarioIds  = [...new Set(visitas.filter(v => v.usuario_id).map(v => v.usuario_id!))];

  const [
    { data: inmueblesData },
    { data: compradoresData },
    { data: agentesData },
    { data: selectInmuebles },
    { data: selectCompradores },
  ] = await Promise.all([
    inmuebleIds.length
      ? supabase.from("inmuebles").select("id, direccion").in("id", inmuebleIds)
      : Promise.resolve({ data: [] }),
    supabase.from("compradores").select("id, nombre").eq("tenant_id", usuario.tenant_id).order("nombre"),
    usuarioIds.length
      ? supabase.from("usuarios").select("id, nombre_completo").in("id", usuarioIds)
      : Promise.resolve({ data: [] }),
    supabase.from("inmuebles").select("id, direccion").eq("tenant_id", usuario.tenant_id).order("direccion"),
    supabase.from("compradores").select("id, nombre").eq("tenant_id", usuario.tenant_id).order("nombre"),
  ]);

  const { data: todosAgentes } = await supabase
    .from("usuarios").select("id, nombre_completo").eq("tenant_id", usuario.tenant_id).eq("activo", true);

  const mapInmueble  = new Map((inmueblesData  ?? []).map(i => [i.id, i.direccion]));
  const mapAgente    = new Map((agentesData    ?? []).map(u => [u.id, u.nombre_completo]));

  // No tenemos comprador_id en eventos_agenda aún — lo dejamos null por ahora
  function getCliente() { return null; }

  // KPIs
  const ahora  = new Date();
  const hoy    = new Date(); hoy.setHours(0, 0, 0, 0);
  const finSem = new Date(hoy); finSem.setDate(hoy.getDate() + 6); finSem.setHours(23, 59, 59, 999);

  const kpis = [
    {
      label: "Hoy",
      value: visitas.filter(v => { const f = new Date(v.fecha_hora); f.setHours(0,0,0,0); return f.getTime() === hoy.getTime(); }).length,
      color: "text-primary", bg: "bg-primary/5",
    },
    {
      label: "Esta semana",
      value: visitas.filter(v => { const f = new Date(v.fecha_hora); return f >= hoy && f <= finSem; }).length,
      color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Pendientes",
      value: visitas.filter(v => v.estado === "pendiente").length,
      color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      label: "Confirmadas",
      value: visitas.filter(v => v.estado === "pendiente" && v.confirmado).length,
      color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      label: "Realizadas",
      value: visitas.filter(v => v.estado === "completado").length,
      color: "text-muted-foreground", bg: "bg-muted/40",
    },
    {
      label: "Canceladas",
      value: visitas.filter(v => v.estado === "cancelado").length,
      color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/20",
    },
  ];

  // Agrupación: próximas (pendientes futuras) → hoy → vencidas → realizadas → canceladas
  const proximas  = visitas.filter(v => v.estado === "pendiente" && new Date(v.fecha_hora) >= ahora);
  const vencidas  = visitas.filter(v => v.estado === "pendiente" && new Date(v.fecha_hora) < ahora);
  const realizadas = visitas.filter(v => v.estado === "completado");
  const canceladas = visitas.filter(v => v.estado === "cancelado");

  function renderGrupo(titulo: string, icono: string, items: typeof visitas, emptyMsg?: string) {
    if (items.length === 0 && !emptyMsg) return null;
    return (
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <span>{icono}</span>
          {titulo}
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground">
            {items.length}
          </span>
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 py-2 pl-1">{emptyMsg}</p>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            {items.map(v => (
              <FilaVisita
                key={v.id}
                visita={v}
                nombreInmueble={v.entidad_tipo === "inmueble" ? (mapInmueble.get(v.entidad_id ?? "") ?? null) : null}
                nombreCliente={getCliente()}
                nombreAgente={v.usuario_id ? (mapAgente.get(v.usuario_id) ?? null) : null}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Visitas</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {kpis.map(k => (
          <div key={k.label} className={cn("rounded-xl border p-3 text-center", k.bg)}>
            <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Nueva visita */}
      <NuevaVisitaForm
        inmuebles={selectInmuebles ?? []}
        compradores={selectCompradores ?? []}
        agentes={todosAgentes ?? []}
        esGestor={gestor}
        userId={usuario.id}
      />

      {/* Grupos */}
      {vencidas.length > 0 && renderGrupo("Vencidas sin realizar", "⚠️", vencidas)}
      {renderGrupo("Próximas", "📅", proximas, "No hay visitas programadas")}
      {realizadas.length > 0 && renderGrupo("Realizadas", "✅", realizadas)}
      {canceladas.length > 0 && renderGrupo("Canceladas", "❌", canceladas)}

      {visitas.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <CalendarDays className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">Sin visitas registradas</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Programa tu primera visita con el botón de arriba.
          </p>
        </div>
      )}
    </div>
  );
}
