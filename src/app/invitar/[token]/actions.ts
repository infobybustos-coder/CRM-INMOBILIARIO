"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AceptarActionState = { error: string } | null;

export async function aceptarInvitacion(
  _prevState: AceptarActionState,
  formData: FormData
): Promise<AceptarActionState> {
  const token = String(formData.get("token") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nombre || !password) {
    return { error: "Rellena tu nombre y una contraseña." };
  }

  const admin = createAdminClient();

  const { data: invitacion, error: invError } = await admin
    .from("invitaciones")
    .select("id, tenant_id, email, rol, usado_en, expira_en")
    .eq("token", token)
    .single();

  if (
    invError ||
    !invitacion ||
    invitacion.usado_en !== null ||
    new Date(invitacion.expira_en) < new Date()
  ) {
    return { error: "Esta invitación ya no es válida." };
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: invitacion.email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    return {
      error:
        createError?.message === "User already registered"
          ? "Ya existe una cuenta con ese email."
          : createError?.message ?? "No se pudo crear la cuenta.",
    };
  }

  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: created.user.id,
    tenant_id: invitacion.tenant_id,
    nombre_completo: nombre,
    email: invitacion.email,
    rol: invitacion.rol,
  });

  if (usuarioError) {
    return { error: "No se pudo crear tu perfil de usuario." };
  }

  await admin
    .from("invitaciones")
    .update({ usado_en: new Date().toISOString() })
    .eq("id", invitacion.id);

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({
    email: invitacion.email,
    password,
  });

  redirect("/inmobiliaria");
}
