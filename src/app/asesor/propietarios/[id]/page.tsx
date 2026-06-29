import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioPropietario } from "@/components/asesor/propietarios/formulario-propietario";
import { Notas } from "@/components/asesor/propietarios/notas";
import { Tareas } from "@/components/asesor/propietarios/tareas";
import { Documentos } from "@/components/asesor/propietarios/documentos";
import type { Propietario } from "../constantes";

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
      "id, nombre, telefono, email, whatsapp, direccion, tipo_inmueble, estado, valor_estimado, fecha_ultimo_contacto, fecha_proxima_accion, notas, creado_en"
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

      <h1 className="text-2xl font-semibold">{propietario.nombre}</h1>

      <FormularioPropietario propietario={propietario as Propietario} />

      <Tareas propietarioId={id} tareas={tareas ?? []} />

      <Documentos
        propietarioId={id}
        tenantId={usuario.tenant_id}
        documentos={documentos ?? []}
      />

      <Notas propietarioId={id} actividades={actividades ?? []} />
    </div>
  );
}
