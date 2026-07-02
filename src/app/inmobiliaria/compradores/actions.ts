"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireUsuario() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  return usuario;
}

export type CrearCompradorState = { error: string } | { ok: true } | null;

export async function crearComprador(
  _prevState: CrearCompradorState,
  formData: FormData
): Promise<CrearCompradorState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const presupuestoMin = formData.get("presupuesto_min");
  const presupuestoMax = formData.get("presupuesto_max");
  const zonaBuscadaId = String(formData.get("zona_buscada_id") ?? "");

  const { data, error } = await supabase
    .from("compradores")
    .insert({
      tenant_id: usuario.tenant_id,
      agente_id: usuario.id,
      nombre,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      presupuesto_min: presupuestoMin ? Number(presupuestoMin) : null,
      presupuesto_max: presupuestoMax ? Number(presupuestoMax) : null,
      financiacion: String(formData.get("financiacion") ?? "") || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      zona_buscada_id: zonaBuscadaId || null,
      urgencia: String(formData.get("urgencia") ?? "media"),
      estado: "nuevo",
      notas: String(formData.get("notas") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear el comprador." };

  revalidatePath("/inmobiliaria/compradores");
  redirect(`/inmobiliaria/compradores/${data.id}`);
}
