import "server-only";
import { headers } from "next/headers";

// Cabeceras de geolocalización por IP que añaden los proveedores más
// comunes (Vercel, Cloudflare) delante de la app. En local (npm run
// dev) ninguna existe, así que se asume España por defecto.
export async function paisVisitante(): Promise<string> {
  const listaHeaders = await headers();
  const pais =
    listaHeaders.get("x-vercel-ip-country") ??
    listaHeaders.get("cf-ipcountry") ??
    listaHeaders.get("x-country-code");
  return pais?.toUpperCase() || "ES";
}

export async function monedaVisitante(): Promise<"EUR" | "USD"> {
  const pais = await paisVisitante();
  return pais === "ES" ? "EUR" : "USD";
}
