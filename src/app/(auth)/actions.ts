"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarTelefono, telefonoValido, emailSinteticoDesdeIdentificador } from "@/lib/telefono";
import { validarPassword } from "@/lib/validacion";
import { slugify } from "@/lib/slug";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { METODOS_PAGO } from "@/lib/metodos-pago";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site-url";
import { lineItemMultimoneda } from "@/lib/stripe-checkout";
import { monedaVisitante } from "@/lib/geo";
import { enviarCorreo, enviarCorreoRecuperacion } from "@/lib/correos/enviar";

export type AuthActionState = { error: string } | null;

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmacion = String(formData.get("password_confirmacion") ?? "");
  const telefonoInput = String(formData.get("telefono") ?? "").trim();
  const pais = String(formData.get("pais") ?? "ES");
  const terminos = formData.get("terminos") === "on";
  const tipoPlan = String(formData.get("tipo_plan") ?? "asesor") as "asesor" | "inmobiliaria";
  const planTarifaDeseada = String(formData.get("plan_tarifa") ?? "gratis") as "gratis" | "pago";
  const metodoPago = String(formData.get("metodo_pago") ?? METODOS_PAGO[0]);

  if (!nombre || !email || !telefonoInput || !password) {
    return { error: "Rellena todos los campos obligatorios." };
  }
  if (!terminos) {
    return { error: "Debes aceptar los Términos y Condiciones y la Política de Privacidad." };
  }
  const errorPassword = validarPassword(password);
  if (errorPassword) return { error: errorPassword };
  if (password !== passwordConfirmacion) {
    return { error: "Las contraseñas no coinciden." };
  }
  if (!telefonoValido(pais, telefonoInput)) {
    return { error: "El teléfono no es válido para el país seleccionado." };
  }

  const telefono = normalizarTelefono(pais, telefonoInput);
  const admin = createAdminClient();

  const { count: telefonoExiste } = await admin
    .from("usuarios")
    .select("id", { count: "exact", head: true })
    .eq("telefono", telefono);
  if ((telefonoExiste ?? 0) > 0) {
    return { error: "Ya existe una cuenta con ese teléfono." };
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    return {
      error:
        createError?.message === "User already registered"
          ? "Ya existe una cuenta con ese email."
          : createError?.message ?? "No se pudo crear la cuenta.",
    };
  }

  // El tenant siempre nace en Gratis: si se pidió PRO, se activa cuando se
  // confirme el pedido de pago (ver más abajo), nunca al instante.
  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      nombre,
      slug: slugify(nombre),
      tipo_plan: tipoPlan,
      pais,
      moneda: "EUR",
      plan_tarifa: "gratis",
    })
    .select()
    .single();

  if (tenantError || !tenant) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }

  const { error: usuarioError } = await admin.from("usuarios").insert({
    id: created.user.id,
    tenant_id: tenant.id,
    nombre_completo: nombre,
    email,
    telefono,
    rol: tipoPlan === "inmobiliaria" ? "admin" : "empleado",
  });

  if (usuarioError) {
    await admin.from("tenants").delete().eq("id", tenant.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      error:
        usuarioError.code === "23505"
          ? "Ya existe una cuenta con ese teléfono."
          : "No se pudo crear el perfil de usuario.",
    };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  const urlBase = await siteUrl();
  await enviarCorreo("bienvenida", email, { nombre, empresa: nombre, email, app_url: urlBase });

  if (planTarifaDeseada === "pago") {
    const config = await obtenerConfigPlanes();
    const priceId = tipoPlan === "inmobiliaria" ? config.inmobiliariaProStripePriceId : config.asesorProStripePriceId;

    // Si hay Stripe conectado, el pago es real: se redirige a Checkout y es
    // el webhook quien activa el plan al confirmarse. Si todavía no hay
    // pasarela, se mantiene el flujo manual de pedido pendiente.
    if (priceId) {
      const destino = tipoPlan === "inmobiliaria" ? "/inmobiliaria/suscripcion" : "/asesor/ajustes";
      let checkoutUrl: string | null = null;
      try {
        const customer = await stripe.customers.create({ email, metadata: { tenant_id: tenant.id } });
        await admin.from("tenants").update({ stripe_customer_id: customer.id }).eq("id", tenant.id);

        const url = await siteUrl();
        const moneda = await monedaVisitante();
        const precio = tipoPlan === "inmobiliaria" ? config.inmobiliariaProPrecio : config.asesorProPrecio;
        const lineItem = await lineItemMultimoneda(priceId, moneda, precio);
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customer.id,
          line_items: [lineItem],
          success_url: `${url}${destino}?pago=exito`,
          cancel_url: `${url}${destino}?pago=cancelado`,
          metadata: { tenant_id: tenant.id, tipo_plan: tipoPlan },
          subscription_data: { metadata: { tenant_id: tenant.id, tipo_plan: tipoPlan } },
        });
        checkoutUrl = session.url;
      } catch (err) {
        console.error("Stripe checkout error en signup:", err);
      }
      // Nunca dejamos que un fallo de Stripe caiga en silencio al panel
      // Gratis: si no se pudo generar el checkout, avisamos para que pueda
      // reintentar el pago desde su panel en vez de quedarse sin PRO sin saberlo.
      redirect(checkoutUrl ?? `${destino}?pago=error`);
    } else if (METODOS_PAGO.includes(metodoPago as (typeof METODOS_PAGO)[number])) {
      await admin.from("pedidos").insert({
        tenant_id: tenant.id,
        tipo: "plan_pro",
        concepto: tipoPlan === "inmobiliaria" ? "Cambio a Inmobiliaria PRO" : "Cambio a Asesor PRO",
        importe: tipoPlan === "inmobiliaria" ? config.inmobiliariaProPrecio : config.asesorProPrecio,
        moneda: await monedaVisitante(),
        metodo_pago: metodoPago,
      });
    }
  }

  redirect(tipoPlan === "asesor" ? "/asesor" : "/inmobiliaria");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const identificador = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const email = identificador.includes("@")
    ? identificador
    : emailSinteticoDesdeIdentificador(identificador);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === "Email not confirmed") {
      return {
        error: "Tu email aún no está confirmado. Revisa tu correo.",
      };
    }
    return { error: "Email o contraseña incorrectos." };
  }

  if (data.user) {
    await supabase
      .from("usuarios")
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq("id", data.user.id);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type RecuperacionState = { error: string } | { ok: true } | null;

export async function solicitarRecuperacion(
  _prevState: RecuperacionState,
  formData: FormData
): Promise<RecuperacionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) return { error: "Pon un email válido." };

  const admin = createAdminClient();
  const { data: usuario } = await admin
    .from("usuarios")
    .select("nombre_completo")
    .eq("email", email)
    .maybeSingle();

  if (usuario) {
    await enviarCorreoRecuperacion(email, usuario.nombre_completo);
  }

  // Siempre se responde con éxito, exista o no esa cuenta, para no revelar
  // qué emails están registrados.
  return { ok: true };
}

export async function restablecerContrasena(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const passwordConfirmacion = String(formData.get("password_confirmacion") ?? "");

  const errorPassword = validarPassword(password);
  if (errorPassword) return { error: errorPassword };
  if (password !== passwordConfirmacion) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "El enlace de recuperación ha caducado. Solicita uno nuevo." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No se pudo actualizar la contraseña. Inténtalo de nuevo." };

  if (user.email) {
    const admin = createAdminClient();
    const { data: usuario } = await admin
      .from("usuarios")
      .select("nombre_completo")
      .eq("id", user.id)
      .maybeSingle();
    await enviarCorreo("password_cambiada", user.email, {
      nombre: usuario?.nombre_completo ?? "",
      email: user.email,
      fecha: new Date().toLocaleDateString("es-ES"),
    });
  }

  redirect("/login");
}
