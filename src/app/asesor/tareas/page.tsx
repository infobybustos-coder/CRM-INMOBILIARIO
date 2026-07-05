import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ListaTareas } from "@/components/asesor/lista-tareas";
import { NuevaTarea } from "@/components/asesor/tareas/nueva-tarea";
import { alternarTareaGeneral, editarTareaGeneral, cancelarTareaGeneral } from "./actions";

const RUTA_ENTIDAD: Record<string, string> = {
  propietario: "/asesor/propietarios",
  comprador: "/asesor/compradores",
  inmueble: "/asesor/inmuebles",
};

export default async function TareasPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data: tareas } = await supabase
    .from("tareas")
    .select("id, titulo, descripcion, fecha_vencimiento, estado, entidad_tipo, entidad_id, creado_en")
    .eq("asignado_a", usuario.id)
    .neq("estado", "cancelada")
    .order("estado", { ascending: true })
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false });

  const idsPorTipo: Record<string, Set<string>> = { propietario: new Set(), comprador: new Set(), inmueble: new Set() };
  for (const t of tareas ?? []) {
    if (idsPorTipo[t.entidad_tipo]) idsPorTipo[t.entidad_tipo].add(t.entidad_id);
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

  const items = (tareas ?? []).map((t) => ({
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tareas</h1>
        <p className="mt-1 text-muted-foreground">
          Tus pendientes, con o sin ficha asociada, en un solo sitio.
        </p>
      </div>

      <NuevaTarea />

      <ListaTareas
        items={items}
        alternarTareaAction={alternarTareaGeneral}
        editarTareaAction={editarTareaGeneral}
        cancelarTareaAction={cancelarTareaGeneral}
      />
    </div>
  );
}
