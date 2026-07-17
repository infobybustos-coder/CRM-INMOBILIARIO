"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site-url";
import { enviarCorreo } from "@/lib/correos/enviar";
import { obtenerRegistroCorreo } from "@/lib/correos/db";
import { esClavePlantilla } from "@/lib/correos/tipos";
import type { ClavePlantilla } from "@/lib/correos/tipos";

export type GuardarPlantillaState = { error: string } | { ok: true } | null;

export async function guardarPlantilla(
  _prev: GuardarPlantillaState,
  formData: FormData
): Promise<GuardarPlantillaState> {
  await requireSuperadmin();

  const clave = String(formData.get("clave") ?? "");
  if (!esClavePlantilla(clave)) return { error: "Plantilla no válida." };

  const asunto = String(formData.get("asunto") ?? "").trim();
  const contenidoHtml = String(formData.get("contenido_html") ?? "").trim();
  const botonTexto = String(formData.get("boton_texto") ?? "").trim();
  const botonUrl = String(formData.get("boton_url") ?? "").trim();
  const activo = formData.get("activo") === "on";

  if (!asunto || !contenidoHtml) return { error: "El asunto y el contenido son obligatorios." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("plantillas_email")
    .update({
      asunto,
      contenido_html: contenidoHtml,
      boton_texto: botonTexto || null,
      boton_url: botonUrl || null,
      activo,
      actualizado_en: new Date().toISOString(),
    })
    .eq("clave", clave);

  if (error) return { error: "No se pudo guardar la plantilla." };

  revalidatePath(`/superadmin/correos/${clave}`);
  revalidatePath("/superadmin/correos");
  return { ok: true };
}

export async function alternarActivoPlantilla(clave: ClavePlantilla, activo: boolean) {
  await requireSuperadmin();
  const admin = createAdminClient();
  await admin
    .from("plantillas_email")
    .update({ activo, actualizado_en: new Date().toISOString() })
    .eq("clave", clave);
  revalidatePath("/superadmin/correos");
  revalidatePath(`/superadmin/correos/${clave}`);
}

export type GuardarConfigCorreosState = { error: string } | { ok: true } | null;

export async function guardarConfigCorreos(
  _prev: GuardarConfigCorreosState,
  formData: FormData
): Promise<GuardarConfigCorreosState> {
  await requireSuperadmin();

  const colorPrincipal = String(formData.get("color_principal") ?? "").trim();
  const firma = String(formData.get("firma") ?? "").trim();
  const remitenteNombre = String(formData.get("remitente_nombre") ?? "").trim();
  const remitenteEmail = String(formData.get("remitente_email") ?? "").trim();

  if (!colorPrincipal || !firma || !remitenteNombre || !remitenteEmail) {
    return { error: "Rellena todos los campos." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("config_correos")
    .update({
      color_principal: colorPrincipal,
      firma,
      remitente_nombre: remitenteNombre,
      remitente_email: remitenteEmail,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: "No se pudo guardar la configuración." };

  revalidatePath("/superadmin/correos");
  return { ok: true };
}

// Subida server-side con el cliente de servicio: el bucket "logos" tiene
// políticas RLS pensadas para que cada tenant suba su propio logo bajo su
// carpeta, y el superadmin no encaja en ese esquema — así evitamos
// depender de una política nueva solo para esto.
export async function subirLogoCorreo(formData: FormData): Promise<{ ok: true; url: string } | { error: string }> {
  await requireSuperadmin();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) return { error: "Archivo inválido." };

  const admin = createAdminClient();
  const ruta = `correos/logo_${Date.now()}_${archivo.name}`;
  const { error } = await admin.storage.from("logos").upload(ruta, archivo, { upsert: true });
  if (error) return { error: "No se pudo subir el logo." };

  await admin
    .from("config_correos")
    .update({ logo_url: ruta, actualizado_en: new Date().toISOString() })
    .eq("id", 1);
  revalidatePath("/superadmin/correos");

  const { data } = admin.storage.from("logos").getPublicUrl(ruta);
  return { ok: true, url: data.publicUrl };
}

export async function enviarPlantillaPrueba(
  clave: ClavePlantilla,
  email: string
): Promise<{ ok: true } | { error: string }> {
  await requireSuperadmin();
  if (!email || !email.includes("@")) return { error: "Pon un email válido." };

  const variablesEjemplo: Record<string, string> = {
    nombre: "Nombre de ejemplo",
    empresa: "Empresa de ejemplo",
    email,
    plan: "Plan Asesor PRO",
    fecha: new Date().toLocaleDateString("es-ES"),
    recurso: "propietarios",
    porcentaje: "80",
    app_url: await siteUrl(),
    enlace: "#",
  };

  return enviarCorreo(clave, email, variablesEjemplo);
}

export async function reenviarCorreoRegistro(id: string): Promise<{ ok: true } | { error: string }> {
  const superadmin = await requireSuperadmin();
  const admin = createAdminClient();

  const registro = await obtenerRegistroCorreo(admin, id);
  if (!registro) return { error: "No se encontró ese envío en el registro." };
  if (!esClavePlantilla(registro.plantillaClave)) {
    return { error: "Esa plantilla ya no existe, no se puede reenviar." };
  }

  const resultado = await enviarCorreo(registro.plantillaClave, registro.destinatario, registro.variables, {
    esReenvio: true,
    reenviadoPor: superadmin.email,
  });

  revalidatePath("/superadmin/correos/registro");
  if ("error" in resultado) return { error: resultado.error };
  return { ok: true };
}
