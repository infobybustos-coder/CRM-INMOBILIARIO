import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarioMensual } from "@/components/asesor/calendario-mensual";
import { ListaTareas } from "@/components/asesor/lista-tareas";
import { agruparPorDia, type AgendaItem } from "@/lib/agenda";
import { crearEvento } from "./actions";
import { alternarTareaGeneral, editarTareaGeneral, cancelarTareaGeneral } from "../tareas/actions";

const RUTA_ENTIDAD: Record<string, string> = {
  propietario: "/asesor/propietarios",
  comprador: "/asesor/compradores",
  inmueble: "/asesor/inmuebles",
};

const ETIQUETA_EVENTO: Record<string, string> = {
  llamada: "Llamada",
  visita: "Visita",
  tasacion: "Tasación",
  recordatorio: "Recordatorio",
};

export default async function AgendaPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data: eventos } = await supabase
    .from("eventos_agenda")
    .select("id, tipo, titulo, fecha_hora, estado, entidad_tipo, entidad_id")
    .eq("usuario_id", usuario.id)
    .neq("estado", "cancelado")
    .order("fecha_hora", { ascending: true });

  const idsPorTipo: Record<string, Set<string>> = { propietario: new Set(), comprador: new Set(), inmueble: new Set() };
  for (const e of eventos ?? []) {
    if (e.entidad_tipo && idsPorTipo[e.entidad_tipo]) idsPorTipo[e.entidad_tipo].add(e.entidad_id);
  }

  const [propietarios, compradores, inmuebles] = await Promise.all([
    idsPorTipo.propietario.size
      ? supabase.from("propietarios").select("id, nombre").in("id", [...idsPorTipo.propietario])
      : Promise.resolve({ data: [] }),
    idsPorTipo.comprador.size
      ? supabase.from("compradores").select("id, nombre").in("id", [...idsPorTipo.comprador])
      : Promise.resolve({ data: [] }),
    idsPorTipo.inmueble.size
      ? supabase.from("inmuebles").select("id, direccion").in("id", [...idsPorTipo.inmueble])
      : Promise.resolve({ data: [] }),
  ]);

  const nombrePorEntidad = new Map<string, string>();
  for (const p of propietarios.data ?? []) nombrePorEntidad.set(`propietario-${p.id}`, p.nombre);
  for (const c of compradores.data ?? []) nombrePorEntidad.set(`comprador-${c.id}`, c.nombre);
  for (const i of inmuebles.data ?? []) nombrePorEntidad.set(`inmueble-${i.id}`, i.direccion);

  const items = (eventos ?? []).map((e) => ({
    id: e.id,
    origen: "evento" as const,
    titulo: e.titulo,
    descripcion: null,
    fecha_vencimiento: e.fecha_hora,
    estado: e.estado === "completado" ? "completada" : "pendiente",
    entidad_tipo: e.entidad_tipo,
    entidad_nombre: e.entidad_tipo ? (nombrePorEntidad.get(`${e.entidad_tipo}-${e.entidad_id}`) ?? null) : null,
    entidad_href: e.entidad_tipo ? `${RUTA_ENTIDAD[e.entidad_tipo] ?? "/asesor"}/${e.entidad_id}` : "/asesor/agenda",
    etiqueta_origen: ETIQUETA_EVENTO[e.tipo] ?? e.tipo,
  }));

  const agendaItems: AgendaItem[] = items
    .filter((it) => it.fecha_vencimiento)
    .map((it) => ({
      id: it.id,
      origen: it.origen,
      titulo: it.titulo,
      fecha: it.fecha_vencimiento as string,
      estado: it.estado,
    }));
  const itemsPorDia = agruparPorDia(agendaItems);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="mt-1 text-muted-foreground">
          Llamadas, visitas, tasaciones y recordatorios — todo en tu calendario.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[340px_1fr] md:items-start">
        <CalendarioMensual itemsPorDia={itemsPorDia} crearEventoAction={crearEvento} />

        <ListaTareas
          items={items}
          alternarTareaAction={alternarTareaGeneral}
          editarTareaAction={editarTareaGeneral}
          cancelarTareaAction={cancelarTareaGeneral}
        />
      </div>
    </div>
  );
}
