import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Agenda } from "@/components/asesor/agenda";
import { CalendarioMensual } from "@/components/asesor/calendario-mensual";
import { ResumenTareas } from "@/components/asesor/resumen-tareas";
import { agruparPorDia, type AgendaItem } from "@/lib/agenda";
import { crearEvento, actualizarEstadoEvento } from "./actions";

export default async function AgendaPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const [{ data: eventos }, { data: tareas }] = await Promise.all([
    supabase
      .from("eventos_agenda")
      .select("id, tipo, titulo, fecha_hora, estado")
      .eq("usuario_id", usuario.id)
      .order("fecha_hora", { ascending: true }),
    supabase
      .from("tareas")
      .select("id, titulo, fecha_vencimiento, estado")
      .eq("asignado_a", usuario.id)
      .not("fecha_vencimiento", "is", null)
      .order("fecha_vencimiento", { ascending: true }),
  ]);

  const items: AgendaItem[] = [
    ...(eventos ?? []).map((e) => ({
      id: e.id,
      origen: "evento" as const,
      titulo: e.titulo,
      fecha: e.fecha_hora,
      estado: e.estado,
      tipo: e.tipo,
    })),
    ...(tareas ?? []).map((t) => ({
      id: t.id,
      origen: "tarea" as const,
      titulo: t.titulo,
      fecha: t.fecha_vencimiento as string,
      estado: t.estado,
    })),
  ];

  const itemsPorDia = agruparPorDia(items);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Agenda</h1>

      <ResumenTareas items={items} />

      <CalendarioMensual itemsPorDia={itemsPorDia} crearEventoAction={crearEvento} />

      <Agenda
        eventos={eventos ?? []}
        actualizarEstadoEventoAction={actualizarEstadoEvento}
      />
    </div>
  );
}
