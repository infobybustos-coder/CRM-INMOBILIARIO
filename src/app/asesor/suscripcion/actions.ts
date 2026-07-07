"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
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
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");

  if (nuevoPlan === "pago") {
    return { error: "Usa el flujo de pago para pasar a PRO." };
  }

  if (nuevoPlan === "gratis" && usuario.tenant?.plan_tarifa === "pago") {
    const supabase = await createClient();
    const config = await obtenerConfigPlanes();
    const limites = config.asesorFree;
    const [{ count: propietarios }, { count: inmuebles }, { count: compradores }] = await Promise.all([
      supabase
        .from("propietarios")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", usuario.tenant_id),
      supabase
        .from("inmuebles")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", usuario.tenant_id),
      supabase
        .from("compradores")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", usuario.tenant_id),
    ]);

    const problemas: string[] = [];
    if ((propietarios ?? 0) > limites.propietarios) {
      problemas.push(`${propietarios} propietarios (el plan Gratis solo incluye ${limites.propietarios})`);
    }
    if ((inmuebles ?? 0) > limites.inmuebles) {
      problemas.push(`${inmuebles} inmuebles (el plan Gratis solo incluye ${limites.inmuebles})`);
    }
    if ((compradores ?? 0) > limites.compradores) {
      problemas.push(`${compradores} compradores (el plan Gratis solo incluye ${limites.compradores})`);
    }
    if (problemas.length > 0) {
      return {
        error: `No puedes volver al plan Gratis todavía: tienes ${problemas.join(", ")}. Elimina registros hasta esos límites antes de cambiar de plan.`,
      };
    }
  }

  const admin = createAdminClient();
  await admin.from("tenants").update({ plan_tarifa: nuevoPlan }).eq("id", usuario.tenant_id);

  revalidatePath("/asesor/ajustes");
  revalidatePath("/asesor", "layout");
  return { ok: true };
}

export async function solicitarUpgradePro(metodoPago: string): Promise<CambiarPlanState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");
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
    concepto: "Cambio a Asesor PRO",
    importe: config.asesorProPrecio,
    metodo_pago: metodoPago,
  });
  if (error) return { error: "No se pudo registrar la solicitud. Inténtalo de nuevo." };

  revalidatePath("/asesor/ajustes");
  revalidatePath("/asesor/suscripcion/pago");
  return { ok: true };
}
