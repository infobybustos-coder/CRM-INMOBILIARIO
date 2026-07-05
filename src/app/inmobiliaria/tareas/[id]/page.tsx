import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Link2 } from "lucide-react";
import { requireInmobiliariaEfectivo, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioTarea } from "@/components/inmobiliaria/tareas/formulario-tarea";
import { Notas } from "@/components/asesor/notas";
import { Historial } from "@/components/inmobiliaria/tareas/historial";
import { actualizarTarea, crearComentarioTarea } from "../actions";

const RUTA_ENTIDAD: Record<string, string> = {
  propietario: "/inmobiliaria/propietarios",
  comprador: "/inmobiliaria/compradores",
  inmueble: "/inmobiliaria/inmuebles",
};

export default async function TareaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await requireInmobiliariaEfectivo();
  const { id } = await params;
  const supabase = await createClient();
  const gestor = esGestor(usuario.rol);

  const { data: tarea } = await supabase
    .from("tareas")
    .select(
      "id, titulo, descripcion, fecha_vencimiento, estado, prioridad, asignado_a, entidad_tipo, entidad_id"
    )
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  if (!tarea) notFound();
  if (!gestor && tarea.asignado_a !== usuario.id) notFound();

  const [{ data: agentes }, { data: actividades }, entidad] = await Promise.all([
    gestor
      ? supabase
          .from("usuarios")
          .select("id, nombre_completo")
          .eq("tenant_id", usuario.tenant_id)
          .eq("activo", true)
          .order("nombre_completo")
      : Promise.resolve({ data: [] as { id: string; nombre_completo: string }[] }),
    supabase
      .from("actividades")
      .select("id, tipo, contenido, creado_en")
      .eq("entidad_tipo", "tarea")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
    tarea.entidad_tipo === "propietario"
      ? supabase.from("propietarios").select("nombre").eq("id", tarea.entidad_id).single()
      : tarea.entidad_tipo === "comprador"
        ? supabase.from("compradores").select("nombre").eq("id", tarea.entidad_id).single()
        : tarea.entidad_tipo === "inmueble"
          ? supabase.from("inmuebles").select("direccion").eq("id", tarea.entidad_id).single()
          : Promise.resolve({ data: null }),
  ]);

  const nombreRelacionado = entidad.data
    ? "nombre" in entidad.data
      ? entidad.data.nombre
      : entidad.data.direccion
    : null;

  const comentarios = (actividades ?? []).filter((a) => a.tipo === "nota");
  const historial = (actividades ?? []).filter((a) => a.tipo !== "nota");

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href={gestor ? "/inmobiliaria/seguimiento" : "/inmobiliaria/mis-tareas"}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {gestor ? "Volver a seguimiento" : "Volver a tareas"}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{tarea.titulo}</h1>
        {nombreRelacionado && tarea.entidad_tipo && (
          <Link
            href={`${RUTA_ENTIDAD[tarea.entidad_tipo]}/${tarea.entidad_id}`}
            className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Link2 className="size-3.5" /> {nombreRelacionado}
          </Link>
        )}
      </div>

      <FormularioTarea
        tarea={tarea}
        agentes={agentes ?? []}
        actualizarTareaAction={actualizarTarea.bind(null, id)}
      />

      <Notas
        actividades={comentarios}
        crearNotaAction={crearComentarioTarea.bind(null, id)}
        titulo="Comentarios internos"
      />

      <Historial eventos={historial} />
    </div>
  );
}
