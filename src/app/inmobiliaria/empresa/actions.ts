"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function actualizarEmpresa(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario || !esGestor(usuario.rol)) redirect("/inmobiliaria");

  const supabase = await createClient();
  await supabase
    .from("tenants")
    .update({
      nombre: String(formData.get("nombre") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || null,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      direccion: String(formData.get("direccion") ?? "").trim() || null,
      web: String(formData.get("web") ?? "").trim() || null,
    })
    .eq("id", usuario.tenant_id);

  revalidatePath("/inmobiliaria/empresa");
}
