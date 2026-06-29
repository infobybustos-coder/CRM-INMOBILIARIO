import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioPropietario } from "@/components/asesor/propietarios/formulario-propietario";
import { Notas } from "@/components/asesor/notas";
import { Tareas } from "@/components/asesor/tareas";
import { Documentos } from "@/components/asesor/propietarios/documentos";
import { crearNota, crearTarea, alternarTarea } from "../actions";
import type { Propietario } from "../constantes";
import { calcularPrioridad, calcularCaptacionScore } from "@/lib/prioridad";
import { cn } from "@/lib/utils";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

export default async function PropietarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: propietario } = await supabase
    .from("propietarios")
    .select(
      "id, nombre, telefono, email, whatsapp, direccion, tipo_inmueble, estado, valor_estimado, fecha_ultimo_contacto, fecha_proxima_accion, fuente_lead, guion_captacion, notas, creado_en"
    )
    .eq("id", id)
    .eq("agente_id", usuario.id)
    .single();

  if (!propietario) notFound();

  const [{ data: actividades }, { data: tareas }, { data: documentos }] = await Promise.all([
    supabase
      .from("actividades")
      .select("id, tipo, contenido, creado_en")
      .eq("entidad_tipo", "propietario")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("tareas")
      .select("id, titulo, descripcion, fecha_vencimiento, estado")
      .eq("entidad_tipo", "propietario")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("documentos")
      .select("id, tipo_documento, nombre_archivo, url_storage, creado_en")
      .eq("entidad_tipo", "propietario")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/asesor/propietarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Propietarios
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{propietario.nombre}</h1>
        {(() => {
          const prioridad = calcularPrioridad(propietario);
          return prioridad ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                COLOR_PRIORIDAD[prioridad]
              )}
            >
              Prioridad {prioridad}
            </span>
          ) : null;
        })()}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Score: {calcularCaptacionScore(propietario)}
        </span>
      </div>

      <FormularioPropietario propietario={propietario as Propietario} />

      <Tareas
        entidadId={id}
        tareas={tareas ?? []}
        crearTareaAction={crearTarea.bind(null, id)}
        alternarTareaAction={alternarTarea}
        sugeridas="propietario"
      />

      <Documentos
        propietarioId={id}
        tenantId={usuario.tenant_id}
        documentos={documentos ?? []}
      />

      <Notas actividades={actividades ?? []} crearNotaAction={crearNota.bind(null, id)} />
    </div>
  );
}
