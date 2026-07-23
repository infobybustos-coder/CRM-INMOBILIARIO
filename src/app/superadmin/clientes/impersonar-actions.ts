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

export type TipoVista =
  | "asesor_gratis"
  | "asesor_pro"
  | "inmobiliaria_admin_gratis"
  | "inmobiliaria_admin_pro"
  | "inmobiliaria_empleado_gratis"
  | "inmobiliaria_empleado_pro";

const ETIQUETA_VISTA: Record<TipoVista, string> = {
  asesor_gratis: "Asesor independiente · Gratis",
  asesor_pro: "Asesor independiente · PRO",
  inmobiliaria_admin_gratis: "Administrador de Inmobiliaria · Gratis",
  inmobiliaria_admin_pro: "Administrador de Inmobiliaria · PRO",
  inmobiliaria_empleado_gratis: "Empleado de Inmobiliaria · Gratis",
  inmobiliaria_empleado_pro: "Empleado de Inmobiliaria · PRO",
};

const CONFIG_VISTA: Record<
  TipoVista,
  { tipoPlan: "asesor" | "inmobiliaria"; planTarifa: "gratis" | "pago"; rol: "admin" | "empleado" }
> = {
  asesor_gratis: { tipoPlan: "asesor", planTarifa: "gratis", rol: "empleado" },
  asesor_pro: { tipoPlan: "asesor", planTarifa: "pago", rol: "empleado" },
  inmobiliaria_admin_gratis: { tipoPlan: "inmobiliaria", planTarifa: "gratis", rol: "admin" },
  inmobiliaria_admin_pro: { tipoPlan: "inmobiliaria", planTarifa: "pago", rol: "admin" },
  inmobiliaria_empleado_gratis: { tipoPlan: "inmobiliaria", planTarifa: "gratis", rol: "empleado" },
  inmobiliaria_empleado_pro: { tipoPlan: "inmobiliaria", planTarifa: "pago", rol: "empleado" },
};

// Tenants ficticios propios de Ambraio (tenants.es_demo = true), nunca cuentas
// de clientes reales. Se crean una sola vez (get-or-create) y se reutilizan en
// cada vista previa; por eso quedan excluidos de las métricas de negocio.
async function obtenerOCrearTenantDemo(
  admin: ReturnType<typeof createAdminClient>,
  tipoPlan: "asesor" | "inmobiliaria",
  planTarifa: "gratis" | "pago"
): Promise<string> {
  const slug = `demo-${tipoPlan}-${planTarifa}`;
  const { data: existente } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (existente) return existente.id;

  const nombre = `Demo ${tipoPlan === "asesor" ? "Asesor" : "Inmobiliaria"} ${
    planTarifa === "pago" ? "PRO" : "Gratis"
  }`;
  const { data: tenant, error } = await admin
    .from("tenants")
    .insert({
      nombre,
      slug,
      tipo_plan: tipoPlan,
      pais: "ES",
      moneda: "EUR",
      plan_tarifa: planTarifa,
      es_demo: true,
    })
    .select("id")
    .single();
  if (error || !tenant) throw new Error("No se pudo crear el tenant de demostración.");
  return tenant.id;
}

async function obtenerOCrearUsuarioDemo(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  rol: "admin" | "empleado",
  nombreCompleto: string,
  email: string
): Promise<string> {
  const { data: existente } = await admin
    .from("usuarios")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle();
  if (existente) return existente.id;

  const { data: creado, error: createError } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (createError || !creado.user) throw new Error("No se pudo crear el usuario de demostración.");

  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: creado.user.id,
    tenant_id: tenantId,
    nombre_completo: nombreCompleto,
    email,
    rol,
  });
  if (usuarioError) {
    await admin.auth.admin.deleteUser(creado.user.id);
    throw new Error("No se pudo crear el perfil de demostración.");
  }
  return creado.user.id;
}

export async function entrarComoVista(tipo: TipoVista): Promise<{ error: string } | void> {
  await requireSuperadmin();
  const admin = createAdminClient();
  const { tipoPlan, planTarifa, rol } = CONFIG_VISTA[tipo];

  let usuarioId: string;
  try {
    const tenantId = await obtenerOCrearTenantDemo(admin, tipoPlan, planTarifa);
    const sufijoPlan = planTarifa === "pago" ? "pro" : "gratis";
    const email =
      tipoPlan === "asesor"
        ? `demo-asesor-${sufijoPlan}@ambraio.demo`
        : `demo-inmobiliaria-${sufijoPlan}-${rol}@ambraio.demo`;
    const nombreCompleto =
      tipoPlan === "asesor"
        ? `Demo Asesor ${planTarifa === "pago" ? "PRO" : "Gratis"}`
        : `Demo ${rol === "admin" ? "Administrador" : "Empleado"} ${planTarifa === "pago" ? "PRO" : "Gratis"}`;
    usuarioId = await obtenerOCrearUsuarioDemo(admin, tenantId, rol, nombreCompleto, email);
  } catch {
    return { error: `No se pudo preparar la vista de "${ETIQUETA_VISTA[tipo]}".` };
  }

  await iniciarSesionComo(usuarioId);
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
