"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertarMensaje } from "@/lib/soporte/db";
import type { AdjuntoNuevo, EstadoConversacion } from "@/lib/soporte/tipos";

export type ResultadoBusqueda = {
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
  tenantNombre: string;
  tipoPlan: string;
  planTarifa: string;
};

const COLUMNAS =
  "id, nombre_completo, email, telefono, rol, activo, tenant:tenants(nombre, tipo_plan, plan_tarifa)";

export async function buscarUsuario(
  _prev: ResultadoBusqueda[],
  formData: FormData
): Promise<ResultadoBusqueda[]> {
  await requireSuperadmin();

  const query = String(formData.get("query") ?? "").trim();
  if (!query) return [];

  const admin = createAdminClient();
  const patron = `%${query}%`;

  const [porEmail, porTelefono, porNombre] = await Promise.all([
    admin.from("usuarios").select(COLUMNAS).ilike("email", patron).limit(10),
    admin.from("usuarios").select(COLUMNAS).ilike("telefono", patron).limit(10),
    admin.from("usuarios").select(COLUMNAS).ilike("nombre_completo", patron).limit(10),
  ]);

  const vistos = new Set<string>();
  const filas = [
    ...(porEmail.data ?? []),
    ...(porTelefono.data ?? []),
    ...(porNombre.data ?? []),
  ].filter((u) => {
    if (vistos.has(u.id)) return false;
    vistos.add(u.id);
    return true;
  });

  return filas.map((u) => {
    const tenant = Array.isArray(u.tenant) ? u.tenant[0] : u.tenant;
    return {
      usuarioId: u.id,
      nombreCompleto: u.nombre_completo,
      email: u.email,
      telefono: u.telefono,
      rol: u.rol,
      activo: u.activo,
      tenantNombre: tenant?.nombre ?? "",
      tipoPlan: tenant?.tipo_plan ?? "",
      planTarifa: tenant?.plan_tarifa ?? "",
    };
  });
}

function revalidarSoporte() {
  revalidatePath("/superadmin/soporte");
  revalidatePath("/asesor/soporte");
  revalidatePath("/inmobiliaria/soporte");
}

export type EnviarMensajeState = { error: string } | { ok: true };

export async function responderComoSoporte(
  conversacionId: string,
  contenido: string,
  adjuntos: AdjuntoNuevo[]
): Promise<EnviarMensajeState> {
  const superadmin = await requireSuperadmin();

  const contenidoLimpio = contenido.trim();
  if (!contenidoLimpio && adjuntos.length === 0) return { error: "Escribe un mensaje o adjunta un archivo." };

  const admin = createAdminClient();
  try {
    await insertarMensaje(admin, {
      conversacionId,
      autorId: superadmin.id,
      autorTipo: "soporte",
      contenido: contenidoLimpio,
      adjuntos,
    });
  } catch {
    return { error: "No se pudo enviar la respuesta. Inténtalo de nuevo." };
  }

  await admin
    .from("conversaciones")
    .update({ ultima_lectura_soporte: new Date().toISOString() })
    .eq("id", conversacionId);

  revalidarSoporte();
  return { ok: true };
}

export async function cambiarEstadoConversacion(conversacionId: string, nuevoEstado: EstadoConversacion) {
  await requireSuperadmin();

  const admin = createAdminClient();
  await admin.from("conversaciones").update({ estado: nuevoEstado }).eq("id", conversacionId);

  revalidarSoporte();
}

export async function marcarLeidoSoporte(conversacionId: string) {
  await requireSuperadmin();

  const admin = createAdminClient();
  await admin
    .from("conversaciones")
    .update({ ultima_lectura_soporte: new Date().toISOString() })
    .eq("id", conversacionId);
}
