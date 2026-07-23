"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site-url";
import { enviarCorreoBienvenidaColaborador } from "@/lib/correos/enviar";
import { codigoReferidoDisponible } from "@/lib/colaboraciones/db";
import { codigoReferidoValido, generarCodigoReferido, normalizarCodigoReferido } from "@/lib/colaboraciones/codigo";
import type { EstadoColaborador } from "@/lib/colaboraciones/tipos";

export type CrearColaboradorState =
  | { error: string }
  | { ok: true; codigo: string; enlace: string }
  | null;

export async function crearColaborador(
  _prev: CrearColaboradorState,
  formData: FormData
): Promise<CrearColaboradorState> {
  await requireSuperadmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const codigoInput = String(formData.get("codigo_referido") ?? "").trim();

  if (!nombre || !email) return { error: "Rellena el nombre y el email." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El email no es válido." };

  const admin = createAdminClient();
  const codigo = codigoInput ? normalizarCodigoReferido(codigoInput) : generarCodigoReferido(nombre);

  if (!codigoReferidoValido(codigo)) {
    return { error: "El código de referido solo puede tener letras y números (3-20 caracteres)." };
  }
  if (!(await codigoReferidoDisponible(admin, codigo))) {
    return { error: `El código "${codigo}" ya está en uso. Prueba con otro.` };
  }

  const { data: creado, error: createError } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });

  if (createError || !creado.user) {
    return {
      error:
        createError?.message === "User already registered"
          ? "Ya existe una cuenta con ese email."
          : (createError?.message ?? "No se pudo crear la cuenta."),
    };
  }

  const { error: colabError } = await admin.from("colaboradores").insert({
    id: creado.user.id,
    nombre_completo: nombre,
    email,
    codigo_referido: codigo,
  });

  if (colabError) {
    await admin.auth.admin.deleteUser(creado.user.id);
    return {
      error: colabError.code === "23505" ? "Ese email o código ya están en uso." : "No se pudo crear el colaborador.",
    };
  }

  // El email de bienvenida es best-effort: si Resend falla, el colaborador
  // ya existe y el superadmin puede reenviarlo desde el registro de
  // correos — no tiene sentido deshacer el alta por esto.
  await enviarCorreoBienvenidaColaborador(email, nombre, codigo);

  const enlace = `${await siteUrl()}/signup?ref=${codigo}`;
  revalidatePath("/superadmin/colaboraciones");
  return { ok: true, codigo, enlace };
}

export async function alternarEstadoColaborador(id: string, estado: EstadoColaborador) {
  await requireSuperadmin();
  const admin = createAdminClient();
  await admin
    .from("colaboradores")
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/superadmin/colaboraciones");
  revalidatePath(`/superadmin/colaboraciones/${id}`);
}

// Se borra el usuario de auth (no la fila de colaboradores directamente):
// colaboradores.id referencia auth.users(id) ON DELETE CASCADE, así que
// esto se lleva por delante también sus colaborador_referidos, sin dejar
// una cuenta de acceso huérfana que ya no aparece en ningún sitio.
export async function eliminarColaborador(id: string, confirmacionNombre: string) {
  await requireSuperadmin();
  const admin = createAdminClient();
  const { data: colaborador } = await admin
    .from("colaboradores")
    .select("nombre_completo")
    .eq("id", id)
    .maybeSingle();
  if (!colaborador || colaborador.nombre_completo !== confirmacionNombre) return;

  await admin.auth.admin.deleteUser(id);

  revalidatePath("/superadmin/colaboraciones");
  redirect("/superadmin/colaboraciones");
}
