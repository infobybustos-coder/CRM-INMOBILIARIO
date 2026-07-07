"use server";

import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type PlanTarifa } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";

export type CambiarPlanState = { error: string } | { ok: true };

export async function cambiarPlanTarifa(nuevoPlan: PlanTarifa): Promise<CambiarPlanState> {
  const usuario = await requireAdminInmobiliaria();

  if (nuevoPlan === "gratis" && usuario.tenant?.plan_tarifa === "pago") {
    const supabase = await createClient();
    const config = await obtenerConfigPlanes();
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

    const adminsGratis = config.inmobiliariaFree.administradores;
    const asesoresGratis = config.inmobiliariaFree.asesores;

    const problemas: string[] = [];
    if ((adminsActivos ?? 0) > adminsGratis) {
      problemas.push(`${adminsActivos} administradores (el plan Gratis solo incluye ${adminsGratis})`);
    }
    if ((empleadosActivos ?? 0) > asesoresGratis) {
      problemas.push(`${empleadosActivos} asesores (el plan Gratis solo incluye ${asesoresGratis})`);
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
