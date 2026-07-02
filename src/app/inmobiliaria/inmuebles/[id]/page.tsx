import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FichaInmueble } from "@/components/inmobiliaria/inmuebles/ficha-inmueble";
import { SubidaDocumentos } from "@/components/inmobiliaria/subida-documentos";
import { Notas } from "@/components/asesor/notas";
import { Tareas } from "@/components/asesor/tareas";
import {
  crearNotaInmueble,
  crearTareaInmueble,
  alternarTareaInmueble,
} from "@/app/inmobiliaria/inmuebles/actions";

export default async function InmobiliariaInmueblePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const gestor = esGestor(usuario.rol);

  const { data: inmueble, error: inmuebleError } = await supabase
    .from("inmuebles")
    .select(
      "id, referencia, direccion, zona_id, propietario_id, precio, metros_cuadrados, habitaciones, banos, tipo, estado, certificado_energetico, descripcion, fecha_publicacion, creado_en, agente_id"
    )
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  if (inmuebleError || !inmueble) notFound();

  const [
    { data: actividades },
    { data: tareas },
    { data: zonas },
    { data: propietarios },
    { data: documentos },
  ] = await Promise.all([
    supabase
      .from("actividades")
      .select("id, tipo, contenido, creado_en")
      .eq("entidad_tipo", "inmueble")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("tareas")
      .select("id, titulo, descripcion, fecha_vencimiento, estado")
      .eq("entidad_tipo", "inmueble")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("zonas")
      .select("id, nombre, ciudad")
      .eq("tenant_id", usuario.tenant_id)
      .order("nombre", { ascending: true }),
    supabase
      .from("propietarios")
      .select("id, nombre")
      .eq("tenant_id", usuario.tenant_id)
      .order("nombre", { ascending: true }),
    supabase
      .from("documentos")
      .select("id, tipo_documento, nombre_archivo, url_storage, creado_en")
      .eq("entidad_tipo", "inmueble")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
  ]);

  const faltantes = [
    !inmueble.precio && "Precio",
    !inmueble.tipo && "Tipo",
    !inmueble.metros_cuadrados && "m²",
    !inmueble.propietario_id && "Propietario",
    !inmueble.zona_id && "Zona",
    !inmueble.descripcion && "Descripción",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <Link
        href="/inmobiliaria/inmuebles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Inmuebles
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{inmueble.direccion}</h1>
        {inmueble.referencia && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Ref. {inmueble.referencia}
          </span>
        )}
      </div>

      {faltantes.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Ficha incompleta.</strong> Faltan: {faltantes.join(", ")}.
          </span>
        </div>
      )}

      <FichaInmueble
        inmueble={inmueble}
        zonas={zonas ?? []}
        propietarios={propietarios ?? []}
      />

      <SubidaDocumentos
        entidadTipo="inmueble"
        entidadId={id}
        tenantId={usuario.tenant_id}
        documentos={documentos ?? []}
      />

      <Tareas
        entidadId={id}
        tareas={tareas ?? []}
        crearTareaAction={crearTareaInmueble.bind(null, id)}
        alternarTareaAction={alternarTareaInmueble}
        sugeridas="inmueble"
      />

      <Notas
        actividades={actividades ?? []}
        crearNotaAction={crearNotaInmueble.bind(null, id)}
      />
    </div>
  );
}
