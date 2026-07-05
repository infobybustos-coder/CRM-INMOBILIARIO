import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const COOKIE_VISTA_COMO = "vista_como_id";

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

export async function requireInmobiliaria() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "inmobiliaria") redirect("/asesor");
  return usuario;
}

// Un admin puede "ver como" un empleado de su misma inmobiliaria sin crear
// otra sesión: solo afecta a qué datos ven las páginas propias del empleado
// (mis-*, mi-agenda, perfil), nunca a los permisos reales de escritura, que
// siguen siendo los del admin autenticado (RLS sigue usando su auth.uid()).
export async function obtenerImpersonacion() {
  const real = await getUsuarioConTenant();
  if (!real || real.rol !== "admin") return { real, objetivo: null };

  const cookieStore = await cookies();
  const vistaComoId = cookieStore.get(COOKIE_VISTA_COMO)?.value;
  if (!vistaComoId) return { real, objetivo: null };

  const supabase = await createClient();
  const { data: objetivo } = await supabase
    .from("usuarios")
    .select("*, tenant:tenants(*)")
    .eq("id", vistaComoId)
    .eq("tenant_id", real.tenant_id)
    .eq("rol", "empleado")
    .eq("activo", true)
    .single();

  return { real, objetivo: objetivo ?? null };
}

export async function requireInmobiliariaEfectivo() {
  const { real, objetivo } = await obtenerImpersonacion();
  if (!real) redirect("/login");
  if (real.tenant?.tipo_plan !== "inmobiliaria") redirect("/asesor");
  return objetivo ?? real;
}
