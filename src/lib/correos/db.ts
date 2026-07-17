import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { esClavePlantilla } from "./tipos";
import type {
  ClavePlantilla,
  ConfigCorreos,
  EstadoEnvioCorreo,
  PlantillaEmail,
  RegistroCorreo,
  VariablesCorreo,
} from "./tipos";

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

function mapRegistro(fila: {
  id: string;
  plantilla_clave: string;
  destinatario: string;
  asunto: string;
  variables: VariablesCorreo;
  estado: string;
  error: string | null;
  es_reenvio: boolean;
  reenviado_por: string | null;
  creado_en: string;
}): RegistroCorreo {
  return {
    id: fila.id,
    plantillaClave: fila.plantilla_clave,
    destinatario: fila.destinatario,
    asunto: fila.asunto,
    variables: fila.variables ?? {},
    estado: fila.estado as EstadoEnvioCorreo,
    error: fila.error,
    esReenvio: fila.es_reenvio,
    reenviadoPor: fila.reenviado_por,
    creadoEn: fila.creado_en,
  };
}

export async function registrarEnvioCorreo(
  admin: AdminClient,
  datos: {
    plantillaClave: string;
    destinatario: string;
    asunto: string;
    variables: VariablesCorreo;
    estado: EstadoEnvioCorreo;
    error?: string | null;
    esReenvio?: boolean;
    reenviadoPor?: string | null;
  }
): Promise<void> {
  const { error } = await admin.from("correos_enviados").insert({
    plantilla_clave: datos.plantillaClave,
    destinatario: datos.destinatario,
    asunto: datos.asunto,
    variables: datos.variables,
    estado: datos.estado,
    error: datos.error ?? null,
    es_reenvio: datos.esReenvio ?? false,
    reenviado_por: datos.reenviadoPor ?? null,
  });
  if (error) console.error("registrarEnvioCorreo:", error);
}

export async function listarRegistroCorreos(
  admin: AdminClient,
  opciones?: { limite?: number; destinatario?: string }
): Promise<RegistroCorreo[]> {
  let query = admin
    .from("correos_enviados")
    .select("*")
    .order("creado_en", { ascending: false })
    .limit(opciones?.limite ?? 100);
  if (opciones?.destinatario) query = query.ilike("destinatario", `%${opciones.destinatario}%`);
  const { data } = await query;
  return (data ?? []).map(mapRegistro);
}

export async function obtenerRegistroCorreo(admin: AdminClient, id: string): Promise<RegistroCorreo | null> {
  const { data } = await admin.from("correos_enviados").select("*").eq("id", id).maybeSingle();
  return data ? mapRegistro(data) : null;
}
