import "server-only";
import { createClient } from "@/lib/supabase/server";

export function esGestor(rol: string): boolean {
  return rol === "administrador" || rol === "director_comercial";
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
