import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioComprador } from "@/components/asesor/compradores/formulario-comprador";
import { Notas } from "@/components/asesor/notas";
import { Tareas } from "@/components/asesor/tareas";
import { crearNota, crearTarea, alternarTarea } from "../actions";
import type { Comprador } from "../constantes";

export default async function CompradorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: comprador } = await supabase
    .from("compradores")
    .select(
      "id, nombre, telefono, email, presupuesto_min, presupuesto_max, financiacion, tipo_inmueble, zona_buscada_id, urgencia, estado, fecha_ultimo_contacto, fecha_proxima_accion, notas, creado_en"
    )
    .eq("id", id)
    .eq("agente_id", usuario.id)
    .single();

  if (!comprador) notFound();

  const [{ data: actividades }, { data: tareas }, { data: zonas }] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/asesor/compradores"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Compradores
      </Link>

      <h1 className="text-2xl font-semibold">{comprador.nombre}</h1>

      <FormularioComprador comprador={comprador as Comprador} zonas={zonas ?? []} />

      <Tareas
        entidadId={id}
        tareas={tareas ?? []}
        crearTareaAction={crearTarea.bind(null, id)}
        alternarTareaAction={alternarTarea}
        sugeridas="comprador"
      />

      <Notas actividades={actividades ?? []} crearNotaAction={crearNota.bind(null, id)} />
    </div>
  );
}
