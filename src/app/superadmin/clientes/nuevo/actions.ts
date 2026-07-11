"use server";

import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarTelefono, telefonoValido } from "@/lib/telefono";
import { siteUrl } from "@/lib/site-url";

export type CrearClienteState = { error: string } | { ok: true } | null;

export async function invitarClienteManual(
  _prev: CrearClienteState,
  formData: FormData
): Promise<CrearClienteState> {
  await requireSuperadmin();

  const empresa = String(formData.get("nombre_empresa") ?? "").trim();
  const contacto = String(formData.get("nombre_contacto") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefonoInput = String(formData.get("telefono") ?? "").trim();
  const pais = String(formData.get("pais") ?? "ES");

  if (!empresa || !contacto || !email || !telefonoInput) {
    return { error: "Rellena todos los campos obligatorios." };
  }
  if (!telefonoValido(pais, telefonoInput)) {
    return { error: "El teléfono no es válido para el país seleccionado." };
  }

  const telefono = normalizarTelefono(pais, telefonoInput);
  const admin = createAdminClient();

  const { count: telefonoExiste } = await admin
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .eq("telefono", telefono);
  if ((telefonoExiste ?? 0) > 0) {
    return { error: "Ya existe una cuenta con ese teléfono." };
  }

  const { data: invitado, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/completar-cuenta`,
  });

  if (inviteError || !invitado.user) {
    console.error("inviteUserByEmail error:", inviteError);
    return {
      error:
        inviteError?.message === "User already registered"
          ? "Ya existe una cuenta con ese email."
          : `No se pudo enviar la invitación: ${inviteError?.message ?? "error desconocido"}`,
    };
  }

  const { error: invitacionError } = await admin.from("invitaciones_cliente").insert({
    usuario_id: invitado.user.id,
    empresa,
    contacto,
    pais,
    telefono,
  });

  if (invitacionError) {
    await admin.auth.admin.deleteUser(invitado.user.id);
    return { error: "No se pudo registrar la invitación. Inténtalo de nuevo." };
  }

  return { ok: true };
}
