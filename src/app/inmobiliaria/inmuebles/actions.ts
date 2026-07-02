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

export type CrearInmuebleState = { error: string } | { ok: true } | null;

export async function crearInmueble(
  _prevState: CrearInmuebleState,
  formData: FormData
): Promise<CrearInmuebleState> {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const direccion = String(formData.get("direccion") ?? "").trim();
  if (!direccion) return { error: "La dirección es obligatoria." };

  const precio = formData.get("precio");
  const metrosCuadrados = formData.get("metros_cuadrados");
  const habitaciones = formData.get("habitaciones");
  const banos = formData.get("banos");
  const fechaPublicacion = formData.get("fecha_publicacion");
  const zonaId = String(formData.get("zona_id") ?? "");
  const propietarioId = String(formData.get("propietario_id") ?? "");

  const { data, error } = await supabase
    .from("inmuebles")
    .insert({
      tenant_id: usuario.tenant_id,
      agente_id: usuario.id,
      direccion,
      referencia: String(formData.get("referencia") ?? "").trim() || null,
      estado: "captacion",
      zona_id: zonaId || null,
      propietario_id: propietarioId || null,
      precio: precio ? Number(precio) : null,
      metros_cuadrados: metrosCuadrados ? Number(metrosCuadrados) : null,
      habitaciones: habitaciones ? Number(habitaciones) : null,
      banos: banos ? Number(banos) : null,
      tipo: String(formData.get("tipo") ?? "") || null,
      certificado_energetico: String(formData.get("certificado_energetico") ?? "").trim() || null,
      descripcion: String(formData.get("descripcion") ?? "").trim() || null,
      fecha_publicacion: fechaPublicacion ? String(fechaPublicacion) : null,
    })
    .select("id")
    .single();

  if (error) {
    return error.code === "23505"
      ? { error: "Esa referencia ya existe." }
      : { error: "No se pudo crear el inmueble." };
  }

  revalidatePath("/inmobiliaria/inmuebles");
  redirect(`/inmobiliaria/inmuebles/${data.id}`);
}
