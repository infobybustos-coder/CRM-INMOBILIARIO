"use server";

import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ResultadoBusqueda = {
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
  tenantNombre: string;
  tipoPlan: string;
  planTarifa: string;
};

const COLUMNAS =
  "id, nombre_completo, email, telefono, rol, activo, tenant:tenants(nombre, tipo_plan, plan_tarifa)";

export async function buscarUsuario(
  _prev: ResultadoBusqueda[],
  formData: FormData
): Promise<ResultadoBusqueda[]> {
  await requireSuperadmin();

  const query = String(formData.get("query") ?? "").trim();
  if (!query) return [];

  const admin = createAdminClient();
  const patron = `%${query}%`;

  const [porEmail, porTelefono, porNombre] = await Promise.all([
    admin.from("usuarios").select(COLUMNAS).ilike("email", patron).limit(10),
    admin.from("usuarios").select(COLUMNAS).ilike("telefono", patron).limit(10),
    admin.from("usuarios").select(COLUMNAS).ilike("nombre_completo", patron).limit(10),
  ]);

  const vistos = new Set<string>();
  const filas = [
    ...(porEmail.data ?? []),
    ...(porTelefono.data ?? []),
    ...(porNombre.data ?? []),
  ].filter((u) => {
    if (vistos.has(u.id)) return false;
    vistos.add(u.id);
    return true;
  });

  return filas.map((u) => {
    const tenant = Array.isArray(u.tenant) ? u.tenant[0] : u.tenant;
    return {
      usuarioId: u.id,
      nombreCompleto: u.nombre_completo,
      email: u.email,
      telefono: u.telefono,
      rol: u.rol,
      activo: u.activo,
      tenantNombre: tenant?.nombre ?? "",
      tipoPlan: tenant?.tipo_plan ?? "",
      planTarifa: tenant?.plan_tarifa ?? "",
    };
  });
}
