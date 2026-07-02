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

export type CrearPropietarioState = { error: string } | { ok: true } | null;

export async function crearPropietario(
  _prevState: CrearPropietarioState,
  formData: FormData
): Promise<CrearPropietarioState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  if (!nombre || !telefono) {
    return { error: "El nombre y el teléfono son obligatorios." };
  }

  const valorEstimado = formData.get("valor_estimado");
  const fechaProximaAccion = formData.get("fecha_proxima_accion");
  const gestor = esGestor(usuario.rol);

  const { data, error } = await supabase
    .from("propietarios")
    .insert({
      tenant_id: usuario.tenant_id,
      agente_id: usuario.id,
      nombre,
      telefono,
      email: String(formData.get("email") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      direccion: String(formData.get("direccion") ?? "").trim() || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      fuente_lead: String(formData.get("fuente_lead") ?? "") || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      fecha_proxima_accion: fechaProximaAccion ? String(fechaProximaAccion) : null,
      estado: "nuevo_lead",
      notas: String(formData.get("notas") ?? "").trim() || null,
      ...(gestor && formData.get("agente_id") ? { agente_id: String(formData.get("agente_id")) } : {}),
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la captación." };

  revalidatePath("/inmobiliaria/propietarios");
  redirect(`/inmobiliaria/propietarios/${data.id}`);
}

export type ActualizarPropietarioState = { error: string } | { ok: true } | null;

export async function actualizarPropietarioInmobiliaria(
  id: string,
  _prevState: ActualizarPropietarioState,
  formData: FormData
): Promise<ActualizarPropietarioState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const valorEstimado = formData.get("valor_estimado");
  const fechaProximaAccion = formData.get("fecha_proxima_accion");
  const fechaUltimoContacto = formData.get("fecha_ultimo_contacto");
  const gestor = esGestor(usuario.rol);

  const { error } = await supabase
    .from("propietarios")
    .update({
      nombre,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      direccion: String(formData.get("direccion") ?? "").trim() || null,
      tipo_inmueble: String(formData.get("tipo_inmueble") ?? "") || null,
      fuente_lead: String(formData.get("fuente_lead") ?? "") || null,
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      fecha_proxima_accion: fechaProximaAccion ? String(fechaProximaAccion) : null,
      fecha_ultimo_contacto: fechaUltimoContacto ? String(fechaUltimoContacto) : null,
      notas: String(formData.get("notas") ?? "").trim() || null,
      ...(gestor && formData.get("agente_id") ? { agente_id: String(formData.get("agente_id")) } : {}),
    })
    .eq("id", id)
    .eq(gestor ? "tenant_id" : "agente_id", gestor ? usuario.tenant_id : usuario.id);

  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath(`/inmobiliaria/propietarios/${id}`);
  revalidatePath("/inmobiliaria/propietarios");
  return { ok: true };
}
