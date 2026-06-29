"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CrearClienteState = { error: string } | { ok: true } | null;

export async function crearClienteRapido(
  _prevState: CrearClienteState,
  formData: FormData
): Promise<CrearClienteState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "Sesión expirada, vuelve a iniciar sesión." };

  const tipo = String(formData.get("tipo") ?? "propietario");
  const supabase = await createClient();

  if (tipo === "inmueble") {
    const direccion = String(formData.get("direccion") ?? "").trim();
    const precio = formData.get("precio");
    if (!direccion) return { error: "Pon al menos la dirección." };

    const { error } = await supabase.from("inmuebles").insert({
      tenant_id: usuario.tenant_id,
      agente_id: usuario.id,
      direccion,
      precio: precio ? Number(precio) : null,
    });

    if (error) return { error: "No se pudo guardar el inmueble." };

    revalidatePath("/asesor");
    revalidatePath("/asesor/inmuebles");
    return { ok: true };
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const direccion = String(formData.get("direccion") ?? "").trim() || null;

  if (!nombre || !telefono) {
    return { error: "Pon al menos el nombre y el teléfono." };
  }

  const tabla = tipo === "comprador" ? "compradores" : "propietarios";

  const { error } = await supabase.from(tabla).insert({
    tenant_id: usuario.tenant_id,
    agente_id: usuario.id,
    nombre,
    telefono,
    email,
    ...(tabla === "propietarios" ? { direccion } : {}),
  });

  if (error) {
    return { error: "No se pudo guardar el cliente." };
  }

  revalidatePath("/asesor");
  revalidatePath(`/asesor/${tabla}`);

  return { ok: true };
}
