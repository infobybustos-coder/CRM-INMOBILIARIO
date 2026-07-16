import "server-only";
import { headers } from "next/headers";

// Prioriza el dominio real de producción cuando está configurado, para que
// los enlaces de los emails (restablecer contraseña, invitaciones...) no
// dependan de desde dónde se dispara la acción: si un superadmin la lanza
// mientras prueba la app en local (npm run dev), el destinatario del email
// es OTRA persona que nunca podrá abrir "localhost". Fuera de producción
// (previews de Vercel, desarrollo local) sigue usando el origin/host de la
// petición, que ahí sí es correcto.
export async function siteUrl() {
  if (process.env.VERCEL_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const listaHeaders = await headers();
  const origin = listaHeaders.get("origin");
  if (origin) return origin;
  const host = listaHeaders.get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  return `${protocolo}://${host}`;
}
