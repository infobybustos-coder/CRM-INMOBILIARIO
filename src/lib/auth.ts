import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export function esGestor(rol: string): boolean {
  return rol === "admin";
}

export async function getUsuarioConTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*, tenant:tenants(*)")
    .eq("id", user.id)
    .single();

  return usuario;
}

export async function requireAdminInmobiliaria() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "inmobiliaria") redirect("/asesor");
  if (usuario.rol !== "admin") redirect("/inmobiliaria");
  return usuario;
}
