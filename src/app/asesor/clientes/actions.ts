"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { limiteRecurso } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";

export type CrearClienteState = { error: string; limite?: true } | { ok: true } | null;

async function limiteAlcanzado(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuario: NonNullable<Awaited<ReturnType<typeof getUsuarioConTenant>>>,
  tabla: "propietarios" | "inmuebles" | "compradores",
  etiqueta: string
): Promise<{ error: string; limite: true } | null> {
  const config = await obtenerConfigPlanes();
  const limite = limiteRecurso(config, usuario.tenant ?? {}, tabla);
  if (limite === null) return null;

  const { count } = await supabase
    .from(tabla)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", usuario.tenant_id);

  if ((count ?? 0) >= limite) {
    return {
      error: `Has llegado al límite de ${limite} ${etiqueta} del plan Gratis. Mejora tu plan para añadir más.`,
      limite: true,
    };
  }
  return null;
}

export async function crearClienteRapido(
  _prevState: CrearClienteState,
  formData: FormData
): Promise<CrearClienteState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) return { error: "Sesión expirada, vuelve a iniciar sesión." };

  const tipo = String(formData.get("tipo") ?? "propietario");
  const supabase = await createClient();

  if (tipo === "inmueble") {
    const referencia = String(formData.get("referencia") ?? "").trim();
    const direccion = String(formData.get("direccion") ?? "").trim();
    const precio = formData.get("precio");
    if (!referencia || !direccion) {
      return { error: "Pon al menos la referencia y la dirección." };
    }

    const limiteError = await limiteAlcanzado(supabase, usuario, "inmuebles", "inmuebles");
    if (limiteError) return limiteError;

    const { error } = await supabase.from("inmuebles").insert({
      tenant_id: usuario.tenant_id,
      agente_id: usuario.id,
      referencia,
      direccion,
      precio: precio ? Number(precio) : null,
    });

    if (error) {
      return error.code === "23505"
        ? { error: "Esa referencia ya existe." }
        : { error: "No se pudo guardar el inmueble." };
    }

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

  const limiteError = await limiteAlcanzado(
    supabase,
    usuario,
    tabla,
    tabla === "compradores" ? "compradores" : "captaciones"
  );
  if (limiteError) return limiteError;

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
