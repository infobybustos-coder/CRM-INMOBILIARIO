"use server";

import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarTelefono, telefonoValido } from "@/lib/telefono";
import { slugify } from "@/lib/slug";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { precioPlan } from "@/lib/planes";
import { METODOS_PAGO } from "@/lib/metodos-pago";

export type CrearClienteState =
  | { error: string }
  | { ok: true; password: string; tenantId: string }
  | null;

function generarPasswordTemporal() {
  const mayus = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minus = "abcdefghijkmnpqrstuvwxyz";
  const digitos = "23456789";
  const azar = (juego: string) => juego[Math.floor(Math.random() * juego.length)];
  const todos = mayus + minus + digitos;
  const base = [azar(mayus), azar(minus), azar(digitos), ...Array.from({ length: 9 }, () => azar(todos))];
  return base.sort(() => Math.random() - 0.5).join("");
}

export async function crearTenantManual(
  _prev: CrearClienteState,
  formData: FormData
): Promise<CrearClienteState> {
  const superadmin = await requireSuperadmin();

  const nombreEmpresa = String(formData.get("nombre_empresa") ?? "").trim();
  const nombreContacto = String(formData.get("nombre_contacto") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefonoInput = String(formData.get("telefono") ?? "").trim();
  const pais = String(formData.get("pais") ?? "ES");
  const tipoPlan = String(formData.get("tipo_plan") ?? "asesor") as "asesor" | "inmobiliaria";
  const planTarifa = String(formData.get("plan_tarifa") ?? "gratis") as "gratis" | "pago";
  const metodoPago = String(formData.get("metodo_pago") ?? "");

  if (planTarifa === "pago" && !METODOS_PAGO.includes(metodoPago as (typeof METODOS_PAGO)[number])) {
    return { error: "Elige un método de pago válido." };
  }

  if (!nombreEmpresa || !nombreContacto || !email || !telefonoInput) {
    return { error: "Rellena todos los campos obligatorios." };
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

  const password = generarPasswordTemporal();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return {
      error:
        createError?.message === "User already registered"
          ? "Ya existe una cuenta con ese email."
          : (createError?.message ?? "No se pudo crear la cuenta."),
    };
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      nombre: nombreEmpresa,
      slug: slugify(nombreEmpresa),
      tipo_plan: tipoPlan,
      pais,
      moneda: "EUR",
      plan_tarifa: planTarifa,
      estado: "activo",
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
    nombre_completo: nombreContacto,
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

  await admin.from("tenant_eventos").insert({
    tenant_id: tenant.id,
    tipo: "estado",
    descripcion: `Cliente creado manualmente por ${superadmin.email}.`,
  });

  if (planTarifa === "pago") {
    const config = await obtenerConfigPlanes();
    await admin.from("pedidos").insert({
      tenant_id: tenant.id,
      tipo: "ajuste_manual",
      concepto: `Alta manual en ${tipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"} PRO`,
      importe: precioPlan(config, { tipo_plan: tipoPlan, plan_tarifa: planTarifa }),
      metodo_pago: metodoPago,
      estado: "pagado",
      confirmado_en: new Date().toISOString(),
      confirmado_por: superadmin.email,
    });
  }

  return { ok: true, password, tenantId: tenant.id };
}
