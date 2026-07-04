"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ASESORES_INCLUIDOS_INMOBILIARIA,
  ADMINS_INCLUIDOS_INMOBILIARIA,
  PRECIO_ASESOR_EXTRA,
  PRECIO_ADMIN_EXTRA,
} from "@/lib/planes";

export type RolInvitable = "empleado" | "admin";

function revalidarEquipo() {
  revalidatePath("/inmobiliaria/agentes");
  revalidatePath("/inmobiliaria/administradores");
}

export type InvitarState =
  | { error: string }
  | { requierePago: true; precio: number }
  | { ok: true; link: string }
  | null;

export async function invitarMiembro(
  rol: RolInvitable,
  _prevState: InvitarState,
  formData: FormData
): Promise<InvitarState> {
  const usuario = await requireAdminInmobiliaria();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const confirmarExtra = formData.get("confirmarExtra") === "true";

  if (!email || !email.includes("@")) return { error: "Pon un email válido." };

  const supabase = await createClient();

  const { data: existente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("tenant_id", usuario.tenant_id)
    .eq("email", email)
    .maybeSingle();
  if (existente) return { error: "Ya hay un usuario con ese email en tu equipo." };

  const { count: activos } = await supabase
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", usuario.tenant_id)
    .eq("rol", rol)
    .eq("activo", true);

  const esAdmin = rol === "admin";
  const extra = esAdmin ? (usuario.tenant?.admins_extra ?? 0) : (usuario.tenant?.agentes_extra ?? 0);
  const incluidos = esAdmin ? ADMINS_INCLUIDOS_INMOBILIARIA : ASESORES_INCLUIDOS_INMOBILIARIA;
  const limite = incluidos + extra;
  const precio = esAdmin ? PRECIO_ADMIN_EXTRA : PRECIO_ASESOR_EXTRA;

  if ((activos ?? 0) >= limite) {
    if (!confirmarExtra) return { requierePago: true, precio };

    const admin = createAdminClient();
    const campo = esAdmin ? "admins_extra" : "agentes_extra";
    const { error: errorExtra } = await admin
      .from("tenants")
      .update({ [campo]: extra + 1 })
      .eq("id", usuario.tenant_id);
    if (errorExtra) return { error: "No se pudo ampliar el plan." };
  }

  const token = randomUUID();
  const { error } = await supabase.from("invitaciones").insert({
    tenant_id: usuario.tenant_id,
    email,
    rol,
    token,
    invitado_por: usuario.id,
  });
  if (error) return { error: "No se pudo crear la invitación." };

  const listaHeaders = await headers();
  const host = listaHeaders.get("host");
  const protocolo = host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https";
  const link = `${protocolo}://${host}/invitar/${token}`;

  revalidarEquipo();
  return { ok: true, link };
}

export async function eliminarMiembro(id: string) {
  const usuario = await requireAdminInmobiliaria();
  if (id === usuario.id) return;

  const supabase = await createClient();
  await supabase
    .from("usuarios")
    .update({ activo: false })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  revalidarEquipo();
}
