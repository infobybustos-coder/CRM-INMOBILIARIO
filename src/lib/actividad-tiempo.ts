// Umbral para considerar a alguien "conectado ahora": el latido se manda
// cada minuto, así que 3 minutos da margen a la latencia de red y a que
// la pestaña esté en segundo plano sin haber cerrado sesión de verdad.
export const MINUTOS_CONECTADO = 3;

export function estaConectado(ultimaActividad: string | null): boolean {
  if (!ultimaActividad) return false;
  return Date.now() - new Date(ultimaActividad).getTime() < MINUTOS_CONECTADO * 60 * 1000;
}

export function tiempoDesde(valor: string | null): string {
  if (!valor) return "Nunca";
  const ms = Date.now() - new Date(valor).getTime();
  const minutos = Math.floor(ms / 60000);
  if (minutos < 1) return "Ahora mismo";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `Hace ${dias} d`;
  const meses = Math.floor(dias / 30);
  return `Hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
}
