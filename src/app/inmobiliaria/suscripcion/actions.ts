"use server";

import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMINS_INCLUIDOS_GRATIS, ASESORES_INCLUIDOS_INMOBILIARIA, type PlanTarifa } from "@/lib/planes";

export type CambiarPlanState = { error: string } | { ok: true };

export async function cambiarPlanTarifa(nuevoPlan: PlanTarifa): Promise<CambiarPlanState> {
  const usuario = await requireAdminInmobiliaria();

  if (nuevoPlan === "gratis" && usuario.tenant?.plan_tarifa === "pago") {
    const supabase = await createClient();
    const [{ count: adminsActivos }, { count: empleadosActivos }] = await Promise.all([
      supabase
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", usuario.tenant_id)
        .eq("rol", "admin")
        .eq("activo", true),
      supabase
        .from("usuarios")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", usuario.tenant_id)
        .eq("rol", "empleado")
        .eq("activo", true),
    ]);

    const problemas: string[] = [];
    if ((adminsActivos ?? 0) > ADMINS_INCLUIDOS_GRATIS) {
      problemas.push(`${adminsActivos} administradores (el plan Gratis solo incluye ${ADMINS_INCLUIDOS_GRATIS})`);
    }
    if ((empleadosActivos ?? 0) > ASESORES_INCLUIDOS_INMOBILIARIA) {
      problemas.push(`${empleadosActivos} asesores (el plan Gratis solo incluye ${ASESORES_INCLUIDOS_INMOBILIARIA})`);
    }
    if (problemas.length > 0) {
      return {
        error: `No puedes volver al plan Gratis todavía: tienes ${problemas.join(" y ")}. Elimina o desactiva usuarios hasta esos límites antes de cambiar de plan.`,
      };
    }
  }

  const admin = createAdminClient();
  await admin
    .from("tenants")
    .update({
      plan_tarifa: nuevoPlan,
      // En Gratis no existen los asientos extra: si venía de PRO con alguno
      // comprado, se limpian al bajar de plan.
      ...(nuevoPlan === "gratis" ? { admins_extra: 0, agentes_extra: 0 } : {}),
    })
    .eq("id", usuario.tenant_id);

  revalidatePath("/inmobiliaria/suscripcion");
  revalidatePath("/inmobiliaria/administradores");
  revalidatePath("/inmobiliaria/agentes");
  revalidatePath("/inmobiliaria", "layout");
  return { ok: true };
}
