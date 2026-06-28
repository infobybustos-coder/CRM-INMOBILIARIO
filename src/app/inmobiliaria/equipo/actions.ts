"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type InvitarActionState = { error: string } | { link: string } | null;

const ROLES = ["administrador", "director_comercial", "agente", "captador"] as const;

export async function crearInvitacion(
  _prevState: InvitarActionState,
  formData: FormData
): Promise<InvitarActionState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario || usuario.rol !== "administrador") {
    return { error: "No tienes permiso para invitar." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rol = String(formData.get("rol") ?? "");

  if (!email) return { error: "Pon el email de la persona a invitar." };
  if (!ROLES.includes(rol as (typeof ROLES)[number])) {
    return { error: "Elige un rol válido." };
  }

  const admin = createAdminClient();
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
  return { link: `${base}/invitar/${token}` };
}
