"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION_SUPERADMIN, requireSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function entrarComoUsuario(usuarioId: string) {
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
