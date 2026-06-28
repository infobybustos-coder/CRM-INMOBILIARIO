"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(texto: string) {
  return (
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
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
  const tipoPlan = String(formData.get("tipo_plan") ?? "asesor") as
    | "asesor"
    | "inmobiliaria";

  if (!nombre || !email || !password) {
    return { error: "Rellena nombre, email y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return { error: error?.message ?? "No se pudo crear la cuenta." };
  }

  const admin = createAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      nombre,
      slug: slugify(nombre),
      tipo_plan: tipoPlan,
      pais: "ES",
      moneda: "EUR",
    })
    .select()
    .single();

  if (tenantError || !tenant) {
    return { error: "No se pudo crear la cuenta de empresa/asesor." };
  }

  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: data.user.id,
    tenant_id: tenant.id,
    nombre_completo: nombre,
    email,
    rol: tipoPlan === "inmobiliaria" ? "administrador" : "agente",
  });

  if (usuarioError) {
    return { error: "No se pudo crear el perfil de usuario." };
  }

  redirect(tipoPlan === "asesor" ? "/asesor" : "/inmobiliaria");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
