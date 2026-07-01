"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ASESORES_INCLUIDOS_INMOBILIARIA,
  PRECIO_ASESOR_EXTRA,
  esIlimitado,
} from "@/lib/planes";

export type InvitarActionState =
  | { error: string }
  | { link: string; aviso?: string }
  | null;

const ROLES = ["administrador", "director_comercial", "agente", "captador"] as const;

export async function crearInvitacion(
  _prevState: InvitarActionState,
  formData: FormData
): Promise<InvitarActionState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario || !["administrador", "director_comercial"].includes(usuario.rol)) {
    return { error: "No tienes permiso para invitar." };
  }

  if (!esIlimitado(usuario.tenant ?? {})) {
    return {
      error:
        "Invitar a tu equipo requiere el plan de pago Inmobiliaria. Mejora tu plan para añadir asesores.",
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rol = String(formData.get("rol") ?? "");

  if (!email) return { error: "Pon el email de la persona a invitar." };
  if (!ROLES.includes(rol as (typeof ROLES)[number])) {
    return { error: "Elige un rol válido." };
  }

  const admin = createAdminClient();

  const { count: miembrosActuales } = await admin
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", usuario.tenant_id);

  const aviso =
    (miembrosActuales ?? 0) >= ASESORES_INCLUIDOS_INMOBILIARIA
      ? `Este asesor supera los ${ASESORES_INCLUIDOS_INMOBILIARIA} incluidos en tu plan: se añadirán ${PRECIO_ASESOR_EXTRA.toFixed(2)}€/mes a tu factura.`
      : undefined;

  const token = crypto.randomBytes(24).toString("hex");

  const { error } = await admin.from("invitaciones").insert({
    tenant_id: usuario.tenant_id,
    email,
    rol,
    token,
    invitado_por: usuario.id,
  });

  if (error) {
    return { error: "No se pudo crear la invitación." };
  }

  revalidatePath("/inmobiliaria/equipo");

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { link: `${base}/invitar/${token}`, aviso };
}

export type GestionMiembroState = { error: string } | { ok: true } | null;

export async function cambiarRolMiembro(
  _prevState: GestionMiembroState,
  formData: FormData
): Promise<GestionMiembroState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario || !["administrador", "director_comercial"].includes(usuario.rol)) {
    return { error: "No tienes permiso." };
  }

  const miembroId = String(formData.get("miembro_id") ?? "");
  const nuevoRol = String(formData.get("rol") ?? "");

  if (!ROLES.includes(nuevoRol as (typeof ROLES)[number])) {
    return { error: "Rol no válido." };
  }
  if (miembroId === usuario.id) {
    return { error: "No puedes cambiar tu propio rol." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ rol: nuevoRol })
    .eq("id", miembroId)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: "No se pudo cambiar el rol." };

  revalidatePath("/inmobiliaria/equipo");
  return { ok: true };
}

export async function alternarActivoMiembro(
  _prevState: GestionMiembroState,
  formData: FormData
): Promise<GestionMiembroState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario || !["administrador", "director_comercial"].includes(usuario.rol)) {
    return { error: "No tienes permiso." };
  }

  const miembroId = String(formData.get("miembro_id") ?? "");
  const activo = formData.get("activo") === "true";

  if (miembroId === usuario.id) {
    return { error: "No puedes desactivarte a ti mismo." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ activo })
    .eq("id", miembroId)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: "No se pudo actualizar." };

  revalidatePath("/inmobiliaria/equipo");
  return { ok: true };
}
