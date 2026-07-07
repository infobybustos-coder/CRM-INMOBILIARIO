"use server";

import { revalidatePath } from "next/cache";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type PlanTarifa } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { METODOS_PAGO } from "@/lib/metodos-pago";

export type CambiarPlanState = { error: string } | { ok: true };

// El paso a PRO ya no se hace aquí: pasa por solicitarUpgradePro, que crea
// un pedido pendiente de confirmación. Esta función solo gestiona la
// vuelta a Gratis (no implica ningún cobro, así que puede ser instantánea).
export async function cambiarPlanTarifa(nuevoPlan: PlanTarifa): Promise<CambiarPlanState> {
  const usuario = await requireAdminInmobiliaria();

  if (nuevoPlan === "pago") {
    return { error: "Usa el flujo de pago para pasar a PRO." };
  }

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

export async function solicitarUpgradePro(metodoPago: string): Promise<CambiarPlanState> {
  const usuario = await requireAdminInmobiliaria();
  if (usuario.tenant?.plan_tarifa === "pago") {
    return { error: "Ya tienes el plan PRO." };
  }
  if (!METODOS_PAGO.includes(metodoPago as (typeof METODOS_PAGO)[number])) {
    return { error: "Elige un método de pago válido." };
  }

  const admin = createAdminClient();

  const { count: pendientes } = await admin
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", usuario.tenant_id)
    .eq("estado", "iniciado");
  if ((pendientes ?? 0) > 0) {
    return { error: "Ya tienes un pago en revisión. Te avisaremos cuando se confirme." };
  }

  const config = await obtenerConfigPlanes();
  const { error } = await admin.from("pedidos").insert({
    tenant_id: usuario.tenant_id,
    tipo: "plan_pro",
    concepto: "Cambio a Inmobiliaria PRO",
    importe: config.inmobiliariaProPrecio,
    metodo_pago: metodoPago,
  });
  if (error) return { error: "No se pudo registrar la solicitud. Inténtalo de nuevo." };

  revalidatePath("/inmobiliaria/suscripcion");
  revalidatePath("/inmobiliaria/suscripcion/pago");
  return { ok: true };
}
