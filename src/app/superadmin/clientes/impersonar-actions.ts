"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION_SUPERADMIN, requireSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function iniciarSesionComo(usuarioId: string) {
  const superadmin = await requireSuperadmin();

  const admin = createAdminClient();
  const { data: usuario } = await admin
    .from("usuarios")
    .select("id, email, tenant_id")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!usuario) return;

  const supabase = await createClient();
  const {
    data: { session: sesionActual },
  } = await supabase.auth.getSession();
  if (!sesionActual) return;

  const { data: enlace, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: usuario.email,
  });
  const tokenHash = enlace?.properties?.hashed_token;
  if (error || !tokenHash) return;

  const { error: errorVerificacion } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  if (errorVerificacion) return;

  const cookieStore = await cookies();
  cookieStore.set(
    COOKIE_SESION_SUPERADMIN,
    JSON.stringify({
      access_token: sesionActual.access_token,
      refresh_token: sesionActual.refresh_token,
    }),
    { httpOnly: true, secure: true, sameSite: "lax", path: "/" }
  );

  await admin.from("tenant_eventos").insert({
    tenant_id: usuario.tenant_id,
    tipo: "impersonacion",
    descripcion: `${superadmin.email} accedió como ${usuario.email} para dar soporte.`,
  });

  redirect("/");
}

export async function entrarComoUsuario(usuarioId: string) {
  await iniciarSesionComo(usuarioId);
}

export type TipoVista = "asesor" | "inmobiliaria_admin" | "inmobiliaria_empleado";

const ETIQUETA_VISTA: Record<TipoVista, string> = {
  asesor: "Asesor independiente",
  inmobiliaria_admin: "Administrador de Inmobiliaria",
  inmobiliaria_empleado: "Empleado de Inmobiliaria",
};

export async function entrarComoVista(tipo: TipoVista): Promise<{ error: string } | void> {
  await requireSuperadmin();
  const admin = createAdminClient();

  const tipoPlan = tipo === "asesor" ? "asesor" : "inmobiliaria";
  const { data: tenants } = await admin.from("tenants").select("id").eq("tipo_plan", tipoPlan);
  const tenantIds = (tenants ?? []).map((t) => t.id);
  if (tenantIds.length === 0) {
    return { error: `Todavía no hay ninguna cuenta de tipo "${ETIQUETA_VISTA[tipo]}".` };
  }

  let query = admin.from("usuarios").select("id").in("tenant_id", tenantIds);
  if (tipo === "inmobiliaria_admin") query = query.eq("rol", "admin");
  if (tipo === "inmobiliaria_empleado") query = query.eq("rol", "empleado");
  const { data: usuarios } = await query.order("creado_en", { ascending: false }).limit(1);

  const usuario = usuarios?.[0];
  if (!usuario) {
    return { error: `Todavía no hay ninguna cuenta de tipo "${ETIQUETA_VISTA[tipo]}".` };
  }

  await iniciarSesionComo(usuario.id);
}

export async function salirDeImpersonacion() {
  const cookieStore = await cookies();
  const guardado = cookieStore.get(COOKIE_SESION_SUPERADMIN)?.value;
  cookieStore.delete(COOKIE_SESION_SUPERADMIN);

  if (guardado) {
    const { access_token, refresh_token } = JSON.parse(guardado) as {
      access_token: string;
      refresh_token: string;
    };
    const supabase = await createClient();
    await supabase.auth.setSession({ access_token, refresh_token });
  }

  redirect("/superadmin");
}
