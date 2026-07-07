"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarTelefono, telefonoValido, emailSinteticoDesdeIdentificador } from "@/lib/telefono";
import { validarPassword } from "@/lib/validacion";

function slugify(texto: string) {
  return (
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export type AuthActionState = { error: string } | null;

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmacion = String(formData.get("password_confirmacion") ?? "");
  const telefonoInput = String(formData.get("telefono") ?? "").trim();
  const pais = String(formData.get("pais") ?? "ES");
  const terminos = formData.get("terminos") === "on";
  const tipoPlan = String(formData.get("tipo_plan") ?? "asesor") as "asesor" | "inmobiliaria";
  const planTarifa = String(formData.get("plan_tarifa") ?? "gratis") as "gratis" | "pago";

  if (!nombre || !email || !telefonoInput || !password) {
    return { error: "Rellena todos los campos obligatorios." };
  }
  if (!terminos) {
    return { error: "Debes aceptar los Términos y Condiciones y la Política de Privacidad." };
  }
  const errorPassword = validarPassword(password);
  if (errorPassword) return { error: errorPassword };
  if (password !== passwordConfirmacion) {
    return { error: "Las contraseñas no coinciden." };
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

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
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

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      nombre,
      slug: slugify(nombre),
      tipo_plan: tipoPlan,
      pais,
      moneda: "EUR",
      plan_tarifa: planTarifa,
    })
    .select()
    .single();

  if (tenantError || !tenant) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }

  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: created.user.id,
    tenant_id: tenant.id,
    nombre_completo: nombre,
    email,
    telefono,
    rol: tipoPlan === "inmobiliaria" ? "admin" : "empleado",
  });

  if (usuarioError) {
    await admin.from("tenants").delete().eq("id", tenant.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      error:
        usuarioError.code === "23505"
          ? "Ya existe una cuenta con ese teléfono."
          : "No se pudo crear el perfil de usuario.",
    };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect(tipoPlan === "asesor" ? "/asesor" : "/inmobiliaria");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const identificador = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const email = identificador.includes("@")
    ? identificador
    : emailSinteticoDesdeIdentificador(identificador);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === "Email not confirmed") {
      return {
        error: "Tu email aún no está confirmado. Revisa tu correo.",
      };
    }
    return { error: "Email o contraseña incorrectos." };
  }

  if (data.user) {
    await supabase
      .from("usuarios")
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq("id", data.user.id);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
