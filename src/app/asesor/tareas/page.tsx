import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ListaTareas } from "@/components/asesor/lista-tareas";
import {
  alternarTareaGeneral,
  editarTareaGeneral,
  cancelarTareaGeneral,
  crearTareaGeneral,
} from "./actions";

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

export default async function TareasPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const [{ data: tareas }, { data: eventos }] = await Promise.all([
    supabase
      .from("tareas")
      .select("id, titulo, descripcion, fecha_vencimiento, estado, entidad_tipo, entidad_id, creado_en")
      .eq("asignado_a", usuario.id)
      .neq("estado", "cancelada")
      .order("estado", { ascending: true })
      .order("fecha_vencimiento", { ascending: true, nullsFirst: false }),
    supabase
      .from("eventos_agenda")
      .select("id, tipo, titulo, fecha_hora, estado, entidad_tipo, entidad_id")
      .eq("usuario_id", usuario.id)
      .neq("estado", "cancelado")
      .order("fecha_hora", { ascending: true }),
  ]);

  const idsPorTipo: Record<string, Set<string>> = { propietario: new Set(), comprador: new Set(), inmueble: new Set() };
  for (const t of tareas ?? []) {
    if (idsPorTipo[t.entidad_tipo]) idsPorTipo[t.entidad_tipo].add(t.entidad_id);
  }
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

  const itemsTareas = (tareas ?? []).map((t) => ({
    id: t.id,
    origen: "tarea" as const,
    titulo: t.titulo,
    descripcion: t.descripcion,
    fecha_vencimiento: t.fecha_vencimiento,
    estado: t.estado === "completada" ? "completada" : "pendiente",
    entidad_tipo: t.entidad_tipo,
    entidad_nombre: nombrePorEntidad.get(`${t.entidad_tipo}-${t.entidad_id}`) ?? null,
    entidad_href: `${RUTA_ENTIDAD[t.entidad_tipo] ?? "/asesor"}/${t.entidad_id}`,
    etiqueta_origen: null as string | null,
  }));

  const itemsEventos = (eventos ?? []).map((e) => ({
    id: e.id,
    origen: "evento" as const,
    titulo: e.titulo,
    descripcion: null,
    fecha_vencimiento: e.fecha_hora,
    estado: e.estado === "completado" ? "completada" : "pendiente",
    entidad_tipo: e.entidad_tipo,
    entidad_nombre: e.entidad_tipo
      ? (nombrePorEntidad.get(`${e.entidad_tipo}-${e.entidad_id}`) ?? null)
      : null,
    entidad_href: e.entidad_tipo
      ? `${RUTA_ENTIDAD[e.entidad_tipo] ?? "/asesor"}/${e.entidad_id}`
      : "/asesor/agenda",
    etiqueta_origen: ETIQUETA_EVENTO[e.tipo] ?? e.tipo,
  }));

  const items = [...itemsTareas, ...itemsEventos];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tareas pendientes</h1>
        <p className="mt-1 text-muted-foreground">
          Marca con un tick las que ya hayas hecho. Incluye tareas y eventos de la agenda.
        </p>
      </div>

      <ListaTareas
        items={items}
        alternarTareaAction={alternarTareaGeneral}
        editarTareaAction={editarTareaGeneral}
        cancelarTareaAction={cancelarTareaGeneral}
        crearTareaAction={crearTareaGeneral}
      />
    </div>
  );
}
