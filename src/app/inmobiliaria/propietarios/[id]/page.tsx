import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FichaPropietario } from "@/components/inmobiliaria/propietarios/ficha-propietario";
import { SubidaDocumentos } from "@/components/inmobiliaria/subida-documentos";
import { Notas } from "@/components/asesor/notas";
import { Tareas } from "@/components/asesor/tareas";
import {
  crearNotaPropietario,
  crearTareaPropietario,
  alternarTareaPropietario,
} from "@/app/inmobiliaria/propietarios/actions";
import { calcularPrioridad, calcularCaptacionScore } from "@/lib/prioridad";
import { cn } from "@/lib/utils";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

export default async function InmobiliariaPropietarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const gestor = esGestor(usuario.rol);

  const { data: propietario, error: propietarioError } = await supabase
    .from("propietarios")
    .select(
      "id, nombre, telefono, email, whatsapp, direccion, tipo_inmueble, estado, valor_estimado, fecha_ultimo_contacto, fecha_proxima_accion, fuente_lead, notas, creado_en, agente_id"
    )
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  if (propietarioError || !propietario) notFound();

  const [
    { data: actividades },
    { data: tareas },
    { data: documentos },
    { data: agentes },
  ] = await Promise.all([
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
    gestor
      ? supabase
          .from("usuarios")
          .select("id, nombre_completo")
          .eq("tenant_id", usuario.tenant_id)
          .eq("activo", true)
          .order("nombre_completo")
      : Promise.resolve({ data: [] }),
  ]);

  const faltantes = [
    !propietario.telefono && "Teléfono",
    !propietario.direccion && "Dirección",
    !propietario.tipo_inmueble && "Tipo de inmueble",
    !propietario.valor_estimado && "Valor estimado",
    !propietario.fuente_lead && "Fuente del lead",
  ].filter(Boolean) as string[];

  const prioridad = calcularPrioridad(propietario);

  return (
    <div className="space-y-6">
      <Link
        href="/inmobiliaria/propietarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Captaciones
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{propietario.nombre}</h1>
        {prioridad && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase",
              COLOR_PRIORIDAD[prioridad]
            )}
          >
            Prioridad {prioridad}
          </span>
        )}
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          Score: {calcularCaptacionScore(propietario)}
        </span>
      </div>

      {faltantes.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Ficha incompleta.</strong> Faltan: {faltantes.join(", ")}.
          </span>
        </div>
      )}

      <FichaPropietario
        propietario={propietario}
        agentes={gestor ? (agentes ?? []) : []}
      />

      <SubidaDocumentos
        entidadTipo="propietario"
        entidadId={id}
        tenantId={usuario.tenant_id}
        documentos={documentos ?? []}
      />

      <Tareas
        entidadId={id}
        tareas={tareas ?? []}
        crearTareaAction={crearTareaPropietario.bind(null, id)}
        alternarTareaAction={alternarTareaPropietario}
        sugeridas="propietario"
      />

      <Notas
        actividades={actividades ?? []}
        crearNotaAction={crearNotaPropietario.bind(null, id)}
      />
    </div>
  );
}
