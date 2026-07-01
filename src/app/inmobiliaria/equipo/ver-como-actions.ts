"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";

const ROLES_VALIDOS = ["administrador", "director_comercial", "agente", "captador"];

export async function activarVistaPrevia(formData: FormData) {
  const usuario = await getUsuarioConTenant();
  if (!usuario || !esGestor(usuario.rol)) return;

  const rol = String(formData.get("rol") ?? "");
  const jar = await cookies();

  if (!ROLES_VALIDOS.includes(rol) || rol === usuario.rol) {
    jar.delete("inmobiliaria_ver_como");
  } else {
    jar.set("inmobiliaria_ver_como", rol, { path: "/inmobiliaria", maxAge: 60 * 60 });
  }

  redirect("/inmobiliaria");
}

export async function desactivarVistaPrevia() {
  const jar = await cookies();
  jar.delete("inmobiliaria_ver_como");
  redirect("/inmobiliaria/equipo");
}
