"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITES_GRATIS, type PlanTarifa } from "@/lib/planes";

export type CambiarPlanState = { error: string } | { ok: true };

export async function cambiarPlanTarifa(nuevoPlan: PlanTarifa): Promise<CambiarPlanState> {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");

  if (nuevoPlan === "gratis" && usuario.tenant?.plan_tarifa === "pago") {
    const supabase = await createClient();
    const limites = LIMITES_GRATIS.asesor;
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
