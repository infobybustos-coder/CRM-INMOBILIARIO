"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearOferta(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "No autenticado" };

  const inmueble_id = String(formData.get("inmueble_id") ?? "").trim() || null;
  const comprador_id = String(formData.get("comprador_id") ?? "").trim() || null;
  const importe = Number(formData.get("importe"));
  const nota = String(formData.get("nota") ?? "").trim() || null;

  if (!importe || importe <= 0) return { error: "El importe es obligatorio" };

  const supabase = await createClient();
  const { error } = await supabase.from("ofertas").insert({
    tenant_id: usuario.tenant_id,
    agente_id: usuario.id,
    inmueble_id,
    comprador_id,
    importe,
    nota,
    estado: "pendiente",
  });

  if (error) return { error: error.message };
  revalidatePath("/inmobiliaria/ofertas");
  return { ok: true };
}

export async function cambiarEstadoOferta(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "No autenticado" };

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const contraoferta_importe = formData.get("contraoferta_importe")
    ? Number(formData.get("contraoferta_importe"))
    : null;
  const contraoferta_nota = String(formData.get("contraoferta_nota") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ofertas")
    .update({
      estado,
      actualizado_en: new Date().toISOString(),
      ...(contraoferta_importe !== null && { contraoferta_importe }),
      ...(contraoferta_nota !== null && { contraoferta_nota }),
    })
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id);

  if (error) return { error: error.message };
  revalidatePath("/inmobiliaria/ofertas");
  return { ok: true };
}
