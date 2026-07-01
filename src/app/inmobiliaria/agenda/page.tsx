import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ListTodo, CalendarDays, CheckCircle2, Clock } from "lucide-react";

export default async function AgendaPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();

  // Load all upcoming events + pending tasks
  let eventosQuery = supabase
    .from("eventos_agenda")
    .select("id, titulo, tipo, fecha_hora, estado, entidad_tipo")
    .eq("tenant_id", usuario.tenant_id)
    .neq("estado", "cancelado")
    .order("fecha_hora", { ascending: true })
    .limit(50);
  if (!gestor) eventosQuery = eventosQuery.eq("usuario_id", usuario.id);

  const [{ data: eventos }, { data: tareas }] = await Promise.all([
    eventosQuery,
    supabase
      .from("tareas")
      .select("id, titulo, completada, fecha_vencimiento, entidad_tipo, creado_en")
      .eq("tenant_id", usuario.tenant_id)
      .eq("completada", false)
      .order("fecha_vencimiento", { ascending: true, nullsFirst: false })
      .limit(gestor ? 50 : 20),
  ]);

  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const eventosHoy = (eventos ?? []).filter(e => {
    const f = new Date(e.fecha_hora);
    return f.toDateString() === hoy.toDateString();
  });
  const eventosFuturos = (eventos ?? []).filter(e => {
    const f = new Date(e.fecha_hora);
    return f > hoy && f.toDateString() !== hoy.toDateString();
  });

  const ETIQUETAS_TIPO: Record<string, string> = {
    llamada: "📞 Llamada",
    visita: "🏠 Visita",
    tasacion: "📋 Tasación",
    recordatorio: "🔔 Recordatorio",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Próximas citas, visitas y tareas pendientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <CalendarDays className="mx-auto mb-1 size-5 text-primary" />
          <p className="text-xl font-bold">{eventosHoy.length}</p>
          <p className="text-xs text-muted-foreground">Hoy</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <Clock className="mx-auto mb-1 size-5 text-amber-500" />
          <p className="text-xl font-bold">{eventosFuturos.length}</p>
          <p className="text-xs text-muted-foreground">Próximos</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <ListTodo className="mx-auto mb-1 size-5 text-blue-500" />
          <p className="text-xl font-bold">{(tareas ?? []).length}</p>
          <p className="text-xs text-muted-foreground">Tareas pendientes</p>
        </div>
      </div>

      {/* Today */}
      {eventosHoy.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-primary">Hoy</h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {eventosHoy.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-16 shrink-0 text-center">
                  <p className="text-sm font-bold">
                    {new Date(ev.fecha_hora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{ev.titulo}</p>
                  <p className="text-xs text-muted-foreground">{ETIQUETAS_TIPO[ev.tipo] ?? ev.tipo}</p>
                </div>
                <div className="ml-auto">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    ev.estado === "completado"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {ev.estado === "completado" ? "Hecho" : "Pendiente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {eventosFuturos.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">Próximas citas</h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {eventosFuturos.slice(0, 10).map((ev) => {
              const fecha = new Date(ev.fecha_hora);
              return (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-20 shrink-0 rounded-lg bg-muted px-2 py-1 text-center">
                    <p className="text-xs text-muted-foreground">
                      {fecha.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-xs font-medium">
                      {fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{ev.titulo}</p>
                    <p className="text-xs text-muted-foreground">{ETIQUETAS_TIPO[ev.tipo] ?? ev.tipo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pending tasks */}
      {(tareas ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">Tareas pendientes</h2>
          <div className="rounded-xl border divide-y overflow-hidden">
            {tareas!.map((t) => {
              const vencida = t.fecha_vencimiento && new Date(t.fecha_vencimiento) < hoy;
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <CheckCircle2 className="size-4 shrink-0 text-muted-foreground/40" />
                  <p className="flex-1 font-medium">{t.titulo}</p>
                  {t.fecha_vencimiento && (
                    <span className={`text-xs ${vencida ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                      {vencida ? "⚠ " : ""}
                      {new Date(t.fecha_vencimiento).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {eventosHoy.length === 0 && eventosFuturos.length === 0 && (tareas ?? []).length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <ListTodo className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">Agenda vacía</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Las visitas y tareas que programes aparecerán aquí.
          </p>
        </div>
      )}
    </div>
  );
}
