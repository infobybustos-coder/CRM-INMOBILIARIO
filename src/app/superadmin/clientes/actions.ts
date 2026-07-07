"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoTenant = "activo" | "suspendido" | "cancelado";

export async function cambiarEstadoTenant(tenantId: string, nuevoEstado: EstadoTenant) {
  await requireSuperadmin();

  const admin = createAdminClient();
  await admin.from("tenants").update({ estado: nuevoEstado }).eq("id", tenantId);

  revalidatePath(`/superadmin/clientes/${tenantId}`);
  revalidatePath("/superadmin/clientes");
  revalidatePath("/superadmin");
}
