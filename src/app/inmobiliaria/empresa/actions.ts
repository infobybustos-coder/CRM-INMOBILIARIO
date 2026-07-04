"use server";

import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function revalidarEmpresa() {
  revalidatePath("/inmobiliaria/empresa");
  revalidatePath("/inmobiliaria", "layout");
}

export type EmpresaState = { error: string } | { ok: true } | null;

export async function actualizarEmpresa(
  _prevState: EmpresaState,
  formData: FormData
): Promise<EmpresaState> {
  const usuario = await requireAdminInmobiliaria();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Pon un nombre para la empresa." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({
      nombre,
      cif_nif: String(formData.get("cif_nif") ?? "").trim() || null,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      direccion: String(formData.get("direccion") ?? "").trim() || null,
      web: String(formData.get("web") ?? "").trim() || null,
      zona_horaria: String(formData.get("zona_horaria") ?? "").trim() || null,
    })
    .eq("id", usuario.tenant_id);

  if (error) return { error: "No se pudo guardar." };

  revalidarEmpresa();
  return { ok: true };
}

export async function actualizarLogo(rutaStorage: string) {
  const usuario = await requireAdminInmobiliaria();
  const admin = createAdminClient();
  await admin.from("tenants").update({ logo_url: rutaStorage }).eq("id", usuario.tenant_id);
  revalidarEmpresa();
}
