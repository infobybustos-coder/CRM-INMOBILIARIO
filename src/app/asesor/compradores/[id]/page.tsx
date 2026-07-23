import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioComprador } from "@/components/asesor/compradores/formulario-comprador";
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
import type { Comprador } from "../constantes";
import { calcularPrioridadComprador, calcularCompraScore } from "@/lib/prioridad";
import { cn } from "@/lib/utils";

const COLOR_PRIORIDAD: Record<string, string> = {
  alta: "bg-red-500 text-white",
  media: "bg-amber-500 text-white",
  baja: "bg-muted text-muted-foreground",
};

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
      "id, nombre, telefono, email, presupuesto_min, presupuesto_max, financiacion, tipo_inmueble, zona_buscada_id, habitaciones, urgencia, estado, fecha_ultimo_contacto, fecha_proxima_accion, notas, creado_en, agente_id"
    )
    .eq("id", id)
    .eq(
      esGestor(usuario.rol) ? "tenant_id" : "agente_id",
      esGestor(usuario.rol) ? usuario.tenant_id : usuario.id
    )
    .single();

  if (!comprador) notFound();

  const gestor = esGestor(usuario.rol);
  const [{ data: actividades }, { data: tareas }, { data: zonas }, { data: agentes }, { data: documentos }] =
    await Promise.all([
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

  return (
    <div className="space-y-6">
      <Link
        href="/asesor/compradores"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Compradores
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{comprador.nombre}</h1>
        {(() => {
          const prioridad = calcularPrioridadComprador(comprador);
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
          Score: {calcularCompraScore(comprador)}
        </span>
      </div>

      <FormularioComprador
        comprador={comprador as Comprador}
        zonas={zonas ?? []}
        agentes={gestor ? (agentes ?? []) : []}
      />

      <Documentos
        entidadId={id}
        tenantId={usuario.tenant_id}
        documentos={documentos ?? []}
        carpeta="comprador"
        registrarDocumentoAction={registrarDocumento}
        eliminarDocumentoAction={eliminarDocumento}
      />

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
