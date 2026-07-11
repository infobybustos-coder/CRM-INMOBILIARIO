"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type GuardarConfigState = { error: string } | { ok: true } | null;

function numero(formData: FormData, campo: string): number {
  const valor = Number(formData.get(campo));
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

function textoONull(formData: FormData, campo: string): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor || null;
}

async function actualizarConfig(
  valores: Record<string, number | string | null>
): Promise<GuardarConfigState> {
  await requireSuperadmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("config_planes")
    .update({ ...valores, actualizado_en: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath("/superadmin/suscripciones");
  revalidatePath("/asesor/ajustes");
  revalidatePath("/asesor/suscripcion/pago");
  revalidatePath("/inmobiliaria/suscripcion");
  revalidatePath("/signup");
  return { ok: true };
}

export async function guardarAsesorFree(
  _prev: GuardarConfigState,
  formData: FormData
): Promise<GuardarConfigState> {
  return actualizarConfig({
    asesor_free_propietarios: numero(formData, "propietarios"),
    asesor_free_inmuebles: numero(formData, "inmuebles"),
    asesor_free_compradores: numero(formData, "compradores"),
  });
}

export async function guardarAsesorPro(
  _prev: GuardarConfigState,
  formData: FormData
): Promise<GuardarConfigState> {
  return actualizarConfig({
    asesor_pro_precio: numero(formData, "precio"),
    asesor_pro_stripe_price_id: textoONull(formData, "stripe_price_id"),
  });
}

export async function guardarInmobiliariaFree(
  _prev: GuardarConfigState,
  formData: FormData
): Promise<GuardarConfigState> {
  return actualizarConfig({
    inmobiliaria_free_propietarios: numero(formData, "propietarios"),
    inmobiliaria_free_inmuebles: numero(formData, "inmuebles"),
    inmobiliaria_free_compradores: numero(formData, "compradores"),
    inmobiliaria_free_administradores: numero(formData, "administradores"),
    inmobiliaria_free_asesores: numero(formData, "asesores"),
  });
}

export async function guardarInmobiliariaPro(
  _prev: GuardarConfigState,
  formData: FormData
): Promise<GuardarConfigState> {
  return actualizarConfig({
    inmobiliaria_pro_precio: numero(formData, "precio"),
    inmobiliaria_pro_administradores: numero(formData, "administradores_incluidos"),
    inmobiliaria_pro_asesores: numero(formData, "asesores_incluidos"),
    inmobiliaria_pro_precio_admin_extra: numero(formData, "precio_admin_extra"),
    inmobiliaria_pro_precio_asesor_extra: numero(formData, "precio_asesor_extra"),
    inmobiliaria_pro_stripe_price_id: textoONull(formData, "stripe_price_id"),
  });
}
