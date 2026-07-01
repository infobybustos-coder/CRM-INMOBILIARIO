"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearVenta(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "No autenticado" };

  const inmueble_id = String(formData.get("inmueble_id") ?? "").trim() || null;
  const comprador_id = String(formData.get("comprador_id") ?? "").trim() || null;
  const precio_venta = Number(formData.get("precio_venta")) || null;
  const comision_porcentaje = Number(formData.get("comision_porcentaje")) || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  const comision_importe =
    precio_venta && comision_porcentaje
      ? Math.round(precio_venta * (comision_porcentaje / 100))
      : null;

  const supabase = await createClient();
  const { error } = await supabase.from("ventas").insert({
    tenant_id: usuario.tenant_id,
    agente_id: usuario.id,
    inmueble_id,
    comprador_id,
    precio_venta,
    comision_porcentaje,
    comision_importe,
    notas,
    estado: "reserva",
    fecha_reserva: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/inmobiliaria/ventas");
  return { ok: true };
}

export async function avanzarEtapaVenta(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "No autenticado" };

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");

  const fechas: Record<string, string> = {
    documentacion: "fecha_documentacion",
    firma: "fecha_firma",
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ventas")
    .update({
      estado,
      actualizado_en: new Date().toISOString(),
      ...(fechas[estado] ? { [fechas[estado]]: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: error.message };
  revalidatePath("/inmobiliaria/ventas");
  return { ok: true };
}
