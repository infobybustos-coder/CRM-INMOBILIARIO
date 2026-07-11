import "server-only";
import { headers } from "next/headers";

export async function siteUrl() {
  const listaHeaders = await headers();
  const origin = listaHeaders.get("origin");
  if (origin) return origin;
  const host = listaHeaders.get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  return `${protocolo}://${host}`;
}
