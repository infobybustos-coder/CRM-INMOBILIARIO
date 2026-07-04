import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioInmueble } from "@/components/asesor/inmuebles/formulario-inmueble";
import { Fotos } from "@/components/asesor/inmuebles/fotos";
import { Documentos } from "@/components/asesor/documentos";
import { Notas } from "@/components/asesor/notas";
import { Tareas } from "@/components/asesor/tareas";
import {
  crearNota,
  crearTarea,
  alternarTarea,
  registrarDocumento,
  eliminarDocumento,
} from "../actions";
import type { Inmueble } from "../constantes";

export default async function InmueblePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: inmueble } = await supabase
    .from("inmuebles")
    .select(
      "id, referencia, direccion, zona_id, propietario_id, precio, metros_cuadrados, habitaciones, banos, tipo, estado, certificado_energetico, descripcion, fecha_publicacion, creado_en"
    )
    .eq("id", id)
    .eq("agente_id", usuario.id)
    .single();

  if (!inmueble) notFound();

  const [
    { data: actividades },
    { data: tareas },
    { data: zonas },
    { data: propietarios },
    { data: fotos },
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
      .eq("agente_id", usuario.id)
      .order("nombre", { ascending: true }),
    supabase
      .from("documentos")
      .select("id, nombre_archivo, url_storage, creado_en")
      .eq("entidad_tipo", "inmueble")
      .eq("entidad_id", id)
      .eq("tipo_documento", "foto")
      .order("creado_en", { ascending: false }),
    supabase
      .from("documentos")
      .select("id, tipo_documento, nombre_archivo, url_storage, creado_en")
      .eq("entidad_tipo", "inmueble")
      .eq("entidad_id", id)
      .order("creado_en", { ascending: false }),
  ]);
  const documentosNoFoto = (documentos ?? []).filter((d) => d.tipo_documento !== "foto");

  return (
    <div className="space-y-6">
      <Link
        href="/asesor/inmuebles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Inmuebles
      </Link>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{inmueble.direccion}</h1>
        {inmueble.referencia && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Ref. {inmueble.referencia}
          </span>
        )}
      </div>

      <FormularioInmueble
        inmueble={inmueble as Inmueble}
        zonas={zonas ?? []}
        propietarios={propietarios ?? []}
      />

      <Fotos inmuebleId={id} tenantId={usuario.tenant_id} fotos={fotos ?? []} />

      <Documentos
        entidadId={id}
        tenantId={usuario.tenant_id}
        documentos={documentosNoFoto}
        carpeta="inmueble"
        registrarDocumentoAction={registrarDocumento}
        eliminarDocumentoAction={eliminarDocumento}
      />

      <Tareas
        entidadId={id}
        tareas={tareas ?? []}
        crearTareaAction={crearTarea.bind(null, id)}
        alternarTareaAction={alternarTarea}
        sugeridas="inmueble"
      />

      <Notas actividades={actividades ?? []} crearNotaAction={crearNota.bind(null, id)} />
    </div>
  );
}
