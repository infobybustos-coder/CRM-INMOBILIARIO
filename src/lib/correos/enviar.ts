import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site-url";
import { obtenerConfigCorreos, obtenerPlantilla } from "./db";
import { construirHtmlCorreo, sustituirVariables, urlPublicaLogo } from "./render";
import type { ClavePlantilla, ResultadoEnvio, VariablesCorreo } from "./tipos";

// Nunca lanza: un fallo de envío no debe romper el flujo que lo dispara
// (alta de usuario, cambio de plan...). Siempre devuelve un resultado.
export async function enviarCorreo(
  clave: ClavePlantilla,
  destinatario: string,
  variables: VariablesCorreo
): Promise<ResultadoEnvio> {
  try {
    const admin = createAdminClient();
    const [plantilla, config] = await Promise.all([obtenerPlantilla(admin, clave), obtenerConfigCorreos(admin)]);

    if (!plantilla) return { error: `Plantilla "${clave}" no encontrada.` };
    if (!plantilla.activo) return { ok: true, omitido: true };

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error(`enviarCorreo(${clave}): falta RESEND_API_KEY, correo no enviado.`);
      return { error: "El envío de correos no está configurado todavía." };
    }

    const asunto = sustituirVariables(plantilla.asunto, variables);
    const html = construirHtmlCorreo({
      contenidoHtml: sustituirVariables(plantilla.contenidoHtml, variables),
      botonTexto: plantilla.botonTexto ? sustituirVariables(plantilla.botonTexto, variables) : null,
      botonUrl: plantilla.botonUrl ? sustituirVariables(plantilla.botonUrl, variables) : null,
      colorPrincipal: config.colorPrincipal,
      logoUrl: urlPublicaLogo(config.logoUrl),
      firma: config.firma,
    });

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `${config.remitenteNombre} <${config.remitenteEmail}>`,
      to: destinatario,
      subject: asunto,
      html,
    });

    if (error) {
      console.error(`enviarCorreo(${clave}):`, error);
      return { error: "No se pudo enviar el correo." };
    }
    return { ok: true };
  } catch (err) {
    console.error(`enviarCorreo(${clave}): excepción`, err);
    return { error: "No se pudo enviar el correo." };
  }
}

// Recuperación de contraseña: pide el enlace de acción real a Supabase sin
// que Supabase llegue a enviar ningún correo (así evitamos su límite de
// envíos, pensado solo para pruebas) y lo mandamos nosotros con nuestra
// propia plantilla editable.
export async function enviarCorreoRecuperacion(email: string, nombre: string | null): Promise<ResultadoEnvio> {
  try {
    const admin = createAdminClient();
    const url = await siteUrl();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${url}/auth/callback?next=/restablecer-contrasena` },
    });

    if (error || !data?.properties?.action_link) {
      console.error("enviarCorreoRecuperacion: no se pudo generar el enlace", error);
      return { error: "No se pudo generar el enlace de recuperación." };
    }

    return enviarCorreo("recuperar_password", email, {
      nombre: nombre ?? "",
      email,
      enlace: data.properties.action_link,
    });
  } catch (err) {
    console.error("enviarCorreoRecuperacion: excepción", err);
    return { error: "No se pudo enviar el correo de recuperación." };
  }
}
