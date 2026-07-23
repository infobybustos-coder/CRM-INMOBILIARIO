// Funciones puras (sin "server-only"): el editor de plantillas las
// reutiliza en el cliente para mostrar la vista previa en vivo mientras
// se escribe, sin ir al servidor.

export function sustituirVariables(texto: string, variables: Record<string, string>): string {
  return texto.replace(/\{\{(\w+)\}\}/g, (coincide, clave: string) =>
    Object.prototype.hasOwnProperty.call(variables, clave) ? variables[clave] : coincide
  );
}

// El bucket "logos" es público, así que la URL es una simple concatenación
// determinista — no hace falta un cliente de Supabase para resolverla.
export function urlPublicaLogo(rutaStorage: string | null): string | null {
  if (!rutaStorage) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/logos/${rutaStorage}`;
}

export function construirHtmlCorreo(params: {
  contenidoHtml: string;
  botonTexto?: string | null;
  botonUrl?: string | null;
  colorPrincipal: string;
  logoUrl?: string | null;
  firma: string;
}): string {
  const { contenidoHtml, botonTexto, botonUrl, colorPrincipal, logoUrl, firma } = params;

  const cabecera = logoUrl
    ? `<img src="${logoUrl}" alt="Ambraio" style="max-height:40px;display:block;margin:0 auto 16px;" />`
    : `<p style="text-align:center;margin:0 0 16px;font-size:20px;font-weight:700;color:${colorPrincipal};">Ambraio</p>`;

  const boton =
    botonTexto && botonUrl
      ? `<div style="text-align:center;margin:28px 0;">
           <a href="${botonUrl}" style="display:inline-block;background:${colorPrincipal};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;">${botonTexto}</a>
         </div>`
      : "";

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:32px 16px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="height:6px;background:${colorPrincipal};"></td>
            </tr>
            <tr>
              <td style="padding:32px 40px;">
                ${cabecera}
                <div style="font-size:15px;line-height:1.6;color:#27272a;">
                  ${contenidoHtml}
                </div>
                ${boton}
                <p style="margin:28px 0 0;font-size:13px;color:#71717a;">${firma}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
