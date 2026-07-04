"use server";

import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanTarifa } from "@/lib/planes";

export async function cambiarPlanTarifa(nuevoPlan: PlanTarifa) {
  const usuario = await requireAdminInmobiliaria();

  const admin = createAdminClient();
  await admin.from("tenants").update({ plan_tarifa: nuevoPlan }).eq("id", usuario.tenant_id);

  revalidatePath("/inmobiliaria/suscripcion");
  revalidatePath("/inmobiliaria", "layout");
}
