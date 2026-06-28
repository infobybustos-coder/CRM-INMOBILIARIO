import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getUsuarioConTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*, tenant:tenants(*)")
    .eq("id", user.id)
    .single();

  if (error) {
    return { __debugError: error.message, __debugDetails: error.details, __debugHint: error.hint };
  }

  return usuario;
}
