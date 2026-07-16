import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { esClavePlantilla } from "./tipos";
import type { ClavePlantilla, ConfigCorreos, PlantillaEmail } from "./tipos";

type AdminClient = ReturnType<typeof createAdminClient>;

function mapPlantilla(fila: {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  asunto: string;
  contenido_html: string;
  boton_texto: string | null;
  boton_url: string | null;
  variables_disponibles: string[];
  activo: boolean;
  actualizado_en: string;
}): PlantillaEmail | null {
  if (!esClavePlantilla(fila.clave)) return null;
  return {
    id: fila.id,
    clave: fila.clave,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    asunto: fila.asunto,
    contenidoHtml: fila.contenido_html,
    botonTexto: fila.boton_texto,
    botonUrl: fila.boton_url,
    variablesDisponibles: fila.variables_disponibles ?? [],
    activo: fila.activo,
    actualizadoEn: fila.actualizado_en,
  };
}

export async function obtenerPlantilla(admin: AdminClient, clave: ClavePlantilla): Promise<PlantillaEmail | null> {
  const { data } = await admin.from("plantillas_email").select("*").eq("clave", clave).maybeSingle();
  return data ? mapPlantilla(data) : null;
}

export async function listarPlantillas(admin: AdminClient): Promise<PlantillaEmail[]> {
  const { data } = await admin.from("plantillas_email").select("*").order("nombre");
  return (data ?? []).map(mapPlantilla).filter((p): p is PlantillaEmail => p !== null);
}

const CONFIG_CORREOS_POR_DEFECTO: ConfigCorreos = {
  colorPrincipal: "#7c2d3a",
  logoUrl: null,
  firma: "El equipo de Ambraio",
  remitenteNombre: "Ambraio",
  remitenteEmail: "hola@ambraio.com",
};

export async function obtenerConfigCorreos(admin: AdminClient): Promise<ConfigCorreos> {
  const { data } = await admin
    .from("config_correos")
    .select("color_principal, logo_url, firma, remitente_nombre, remitente_email")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return CONFIG_CORREOS_POR_DEFECTO;
  return {
    colorPrincipal: data.color_principal,
    logoUrl: data.logo_url,
    firma: data.firma,
    remitenteNombre: data.remitente_nombre,
    remitenteEmail: data.remitente_email,
  };
}
