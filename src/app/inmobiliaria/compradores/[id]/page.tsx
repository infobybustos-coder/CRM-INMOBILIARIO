import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FichaComprador } from "@/components/inmobiliaria/compradores/ficha-comprador";
import { SubidaDocumentos } from "@/components/inmobiliaria/subida-documentos";
import { Notas } from "@/components/asesor/notas";
import { Tareas } from "@/components/asesor/tareas";
import {
  crearNotaComprador,
  crearTareaComprador,
  alternarTareaComprador,
} from "@/app/inmobiliaria/compradores/actions";
import { calcularPrioridadComprador, calcularCompraScore } from "@/lib/prioridad";
import { cn } from "@/lib/utils";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

export default async function InmobiliariaCompradorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const gestor = esGestor(usuario.rol);

  const { data: comprador, error: compradorError } = await supabase
    .from("compradores")
    .select(
      "id, nombre, telefono, email, presupuesto_min, presupuesto_max, financiacion, tipo_inmueble, zona_buscada_id, urgencia, estado, fecha_ultimo_contacto, fecha_proxima_accion, notas, creado_en, agente_id"
    )
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  if (compradorError || !comprador) notFound();

  const [
    { data: actividades },
    { data: tareas },
    { data: zonas },
    { data: agentes },
    { data: documentos },
  ] = await Promise.all([
    supabase
      .from("actividades")
      .select("id, tipo, contenido, creado_en")
      .eq("entidad_tipo", "comprador")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("tareas")
      .select("id, titulo, descripcion, fecha_vencimiento, estado")
      .eq("entidad_tipo", "comprador")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("zonas")
      .select("id, nombre, ciudad")
      .eq("tenant_id", usuario.tenant_id)
      .order("nombre", { ascending: true }),
    gestor
      ? supabase
          .from("usuarios")
          .select("id, nombre_completo")
          .eq("tenant_id", usuario.tenant_id)
          .eq("activo", true)
          .order("nombre_completo")
      : Promise.resolve({ data: [] }),
    supabase
      .from("documentos")
      .select("id, tipo_documento, nombre_archivo, url_storage, creado_en")
      .eq("entidad_tipo", "comprador")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
  ]);

  const faltantes = [
    !comprador.telefono && "Teléfono",
    !comprador.presupuesto_max && "Presupuesto máximo",
    !comprador.tipo_inmueble && "Tipo inmueble",
    !comprador.zona_buscada_id && "Zona buscada",
    !comprador.urgencia && "Urgencia",
    !comprador.financiacion && "Financiación",
  ].filter(Boolean) as string[];

  const prioridad = calcularPrioridadComprador(comprador);

  return (
    <div className="space-y-6">
      <Link
        href="/inmobiliaria/compradores"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Compradores
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{comprador.nombre}</h1>
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
          Score: {calcularCompraScore(comprador)}
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

      <FichaComprador
        comprador={comprador}
        zonas={zonas ?? []}
        agentes={gestor ? (agentes ?? []) : []}
      />

      <SubidaDocumentos
        entidadTipo="comprador"
        entidadId={id}
        tenantId={usuario.tenant_id}
        documentos={documentos ?? []}
      />

      <Tareas
        entidadId={id}
        tareas={tareas ?? []}
        crearTareaAction={crearTareaComprador.bind(null, id)}
        alternarTareaAction={alternarTareaComprador}
        sugeridas="comprador"
      />

      <Notas
        actividades={actividades ?? []}
        crearNotaAction={crearNotaComprador.bind(null, id)}
      />
    </div>
  );
}
