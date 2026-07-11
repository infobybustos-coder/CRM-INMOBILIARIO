import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AjustesForm } from "@/components/asesor/ajustes-form";
import { SelectorPlan } from "@/components/asesor/suscripcion/selector-plan";
import { esIlimitado, etiquetaPlan, precioPlan, type PlanTarifa } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ pago?: string }>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const { pago } = await searchParams;

  const supabase = await createClient();
  const config = await obtenerConfigPlanes();
  const ilimitado = esIlimitado(usuario.tenant ?? {});
  const limites =
    usuario.tenant?.tipo_plan === "inmobiliaria" ? config.inmobiliariaFree : config.asesorFree;

  const [{ count: propietarios }, { count: inmuebles }, { count: compradores }] = ilimitado
    ? [{ count: null }, { count: null }, { count: null }]
    : await Promise.all([
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

  const admin = createAdminClient();
  const { count: pedidosPendientes } = await admin
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", usuario.tenant_id)
    .eq("estado", "iniciado");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      {pago === "exito" && (
        <p className="max-w-lg rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-500">
          Pago confirmado — tu plan ya es PRO.
        </p>
      )}
      {pago === "cancelado" && (
        <p className="max-w-lg rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
          Pago cancelado. Puedes intentarlo de nuevo cuando quieras.
        </p>
      )}

      <div className="max-w-lg rounded-lg border p-4">
        <h2 className="text-sm font-medium">Tu plan</h2>
        <p className="mt-1 text-lg font-semibold">
          {etiquetaPlan(usuario.tenant ?? {})}
          {ilimitado && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {precioPlan(config, usuario.tenant ?? {}).toFixed(2)}€/mes
            </span>
          )}
        </p>
        {ilimitado ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Captaciones, inmuebles y compradores ilimitados.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>
              Captaciones: {propietarios ?? 0} / {limites.propietarios}
            </li>
            <li>
              Inmuebles: {inmuebles ?? 0} / {limites.inmuebles}
            </li>
            <li>
              Compradores: {compradores ?? 0} / {limites.compradores}
            </li>
          </ul>
        )}
      </div>

      <div className="max-w-lg space-y-2">
        <h2 className="text-sm font-semibold">Elige tu plan</h2>
        <SelectorPlan
          planActual={(usuario.tenant?.plan_tarifa as PlanTarifa) ?? "gratis"}
          config={config}
          pedidoPendiente={(pedidosPendientes ?? 0) > 0}
        />
        <p className="text-xs text-muted-foreground">
          {config.asesorProStripePriceId
            ? "El pago se procesa de forma segura con Stripe y tu plan se activa automáticamente al confirmarse."
            : "No hay pasarela de pago automática conectada: al solicitar el cambio a PRO, un administrador confirma el pago manualmente antes de activar el plan."}
        </p>
      </div>

      <AjustesForm />
    </div>
  );
}
