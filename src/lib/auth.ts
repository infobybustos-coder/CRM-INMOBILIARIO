import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const COOKIE_VISTA_COMO = "vista_como_id";

export function esGestor(rol: string): boolean {
  return rol === "admin";
}

// El superadmin es un rol de plataforma, no de tenant: no vive en la
// tabla usuarios (que siempre exige tenant_id), solo en superadmins.
export async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: superadmin } = await supabase
    .from("superadmins")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!superadmin) redirect("/login");
  return user;
}

export async function esSuperadmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("superadmins")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  return !!data;
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
// otra sesión: mientras dura la impersonación, tanto lo que se lee como lo
// que se crea/edita desde las páginas y acciones propias del empleado
// (mis-*, mi-agenda, perfil, altas rápidas) se atribuye al empleado
// suplantado, no al admin real. RLS sigue validando con el auth.uid() real
// por debajo, así que el admin nunca pierde ni gana permisos: solo cambia a
// quién se le asignan los registros que él mismo crea mientras impersona.
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

// Para acciones compartidas entre /asesor y /inmobiliaria (altas rápidas,
// notas, tareas por ficha...) que no necesitan redirigir, solo resolver
// quién es el usuario "activo": el empleado suplantado si hay impersonación
// en curso, o el usuario real en cualquier otro caso.
export async function getUsuarioEfectivo() {
  const { real, objetivo } = await obtenerImpersonacion();
  return objetivo ?? real;
}
