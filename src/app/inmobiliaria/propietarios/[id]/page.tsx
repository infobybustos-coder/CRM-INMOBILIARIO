import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FichaPropietario } from "@/components/inmobiliaria/propietarios/ficha-propietario";
import { Notas } from "@/components/asesor/notas";
import { Tareas } from "@/components/asesor/tareas";
import { Documentos } from "@/components/asesor/propietarios/documentos";
import { SiguientePaso } from "@/components/asesor/propietarios/siguiente-paso";
import { GuionCaptacion } from "@/components/asesor/propietarios/guion-captacion";
import {
  crearNota,
  crearTarea,
  alternarTarea,
  crearSiguientePaso,
  actualizarGuionCaptacion,
} from "@/app/asesor/propietarios/actions";
import type { Propietario } from "@/app/asesor/propietarios/constantes";
import { calcularPrioridad, calcularCaptacionScore } from "@/lib/prioridad";
import { AlertCircle } from "lucide-react";
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

  const { data: propietario } = await supabase
    .from("propietarios")
    .select(
      "id, nombre, telefono, email, whatsapp, direccion, tipo_inmueble, estado, valor_estimado, fecha_ultimo_contacto, fecha_proxima_accion, fuente_lead, guion_captacion, notas, creado_en, agente_id"
    )
    .eq("id", id)
    .eq(
      gestor ? "tenant_id" : "agente_id",
      gestor ? usuario.tenant_id : usuario.id
    )
    .single();

  if (!propietario) notFound();

  const [{ data: actividades }, { data: tareas }, { data: documentos }, { data: agentes }] =
    await Promise.all([
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

  return (
    <div className="space-y-6">
      <Link
        href="/inmobiliaria/propietarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Captaciones
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

      {(() => {
        const faltantes = [
          !propietario.telefono && "Teléfono",
          !propietario.direccion && "Dirección",
          !propietario.tipo_inmueble && "Tipo de inmueble",
          !propietario.valor_estimado && "Valor estimado",
          !propietario.fuente_lead && "Fuente del lead",
        ].filter(Boolean) as string[];
        return faltantes.length > 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>Ficha incompleta.</strong> Faltan: {faltantes.join(", ")}.
            </span>
          </div>
        ) : null;
      })()}

      <SiguientePaso
        propietarioId={id}
        nombrePropietario={propietario.nombre}
        crearSiguientePasoAction={crearSiguientePaso}
      />

      <FichaPropietario
        propietario={propietario as Propietario}
        agentes={gestor ? (agentes ?? []) : []}
      />

      <GuionCaptacion
        respuestas={(propietario as Propietario).guion_captacion}
        actualizarGuionAction={actualizarGuionCaptacion.bind(null, id)}
      />

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
