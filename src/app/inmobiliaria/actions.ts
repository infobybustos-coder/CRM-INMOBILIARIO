"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioConTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function registrarDocumentoEntidad(
  entidadTipo: "propietario" | "inmueble" | "comprador",
  entidadId: string,
  nombreArchivo: string,
  urlStorage: string,
  tipoDocumento: string | null
) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");

  const supabase = await createClient();
  const { error } = await supabase.from("documentos").insert({
    tenant_id: usuario.tenant_id,
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    tipo_documento: tipoDocumento,
    nombre_archivo: nombreArchivo,
    url_storage: urlStorage,
    subido_por: usuario.id,
  });

  if (error) throw new Error("No se pudo registrar el documento");
  revalidatePath(`/inmobiliaria/${entidadTipo}s/${entidadId}`);
}

export async function eliminarDocumentoEntidad(
  documentoId: string,
  entidadTipo: "propietario" | "inmueble" | "comprador",
  entidadId: string,
  urlStorage: string
) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");

  const supabase = await createClient();
  await supabase.from("documentos").delete().eq("id", documentoId);
  await supabase.storage.from("documentos").remove([urlStorage]);
  revalidatePath(`/inmobiliaria/${entidadTipo}s/${entidadId}`);
}
