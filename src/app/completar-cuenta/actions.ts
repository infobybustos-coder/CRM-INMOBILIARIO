"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarPassword } from "@/lib/validacion";
import { slugify } from "@/lib/slug";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { METODOS_PAGO } from "@/lib/metodos-pago";

export type CompletarCuentaState = { error: string } | null;

export async function completarInvitacion(
  _prevState: CompletarCuentaState,
  formData: FormData
): Promise<CompletarCuentaState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { error: "Tu sesión no es válida. Pide al administrador que te envíe una invitación nueva." };
  }

  const password = String(formData.get("password") ?? "");
  const passwordConfirmacion = String(formData.get("password_confirmacion") ?? "");
  const terminos = formData.get("terminos") === "on";
  const tipoPlan = String(formData.get("tipo_plan") ?? "asesor") as "asesor" | "inmobiliaria";
  const planTarifaDeseada = String(formData.get("plan_tarifa") ?? "gratis") as "gratis" | "pago";
  const metodoPago = String(formData.get("metodo_pago") ?? "");

  const errorPassword = validarPassword(password);
  if (errorPassword) return { error: errorPassword };
  if (password !== passwordConfirmacion) return { error: "Las contraseñas no coinciden." };
  if (!terminos) {
    return { error: "Debes aceptar los Términos y Condiciones y la Política de Privacidad." };
  }

  const admin = createAdminClient();
  const { data: invitacion } = await admin
    .from("invitaciones_cliente")
    .select("id, empresa, contacto, pais, telefono, completado")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!invitacion || invitacion.completado) {
    return { error: "Esta invitación ya no es válida." };
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) return { error: "No se pudo guardar la contraseña. Inténtalo de nuevo." };

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      nombre: invitacion.empresa,
      slug: slugify(invitacion.empresa),
      tipo_plan: tipoPlan,
      pais: invitacion.pais,
      moneda: "EUR",
      plan_tarifa: "gratis",
    })
    .select()
    .single();

  if (tenantError || !tenant) {
    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }

  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: user.id,
    tenant_id: tenant.id,
    nombre_completo: invitacion.contacto,
    email: user.email,
    telefono: invitacion.telefono,
    rol: tipoPlan === "inmobiliaria" ? "admin" : "empleado",
  });

  if (usuarioError) {
    await admin.from("tenants").delete().eq("id", tenant.id);
    return { error: "No se pudo crear tu perfil. Inténtalo de nuevo." };
  }

  if (planTarifaDeseada === "pago" && METODOS_PAGO.includes(metodoPago as (typeof METODOS_PAGO)[number])) {
    const config = await obtenerConfigPlanes();
    await admin.from("pedidos").insert({
      tenant_id: tenant.id,
      tipo: "plan_pro",
      concepto: tipoPlan === "inmobiliaria" ? "Cambio a Inmobiliaria PRO" : "Cambio a Asesor PRO",
      importe: tipoPlan === "inmobiliaria" ? config.inmobiliariaProPrecio : config.asesorProPrecio,
      moneda: "EUR",
      metodo_pago: metodoPago,
    });
  }

  await admin.from("invitaciones_cliente").update({ completado: true }).eq("id", invitacion.id);

  redirect(tipoPlan === "asesor" ? "/asesor" : "/inmobiliaria");
}
