import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, Clock } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { ConfirmarPago } from "@/components/asesor/suscripcion/confirmar-pago";
import { solicitarUpgradePro } from "@/app/asesor/suscripcion/actions";
import { formatearPrecio } from "@/lib/precio";
import { monedaVisitante } from "@/lib/geo";

export default async function PagoPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");
  if (usuario.tenant?.plan_tarifa === "pago") redirect("/asesor/ajustes");

  const config = await obtenerConfigPlanes();

  // Si hay una pasarela de Stripe conectada, no mostramos el formulario
  // manual: se inicia el checkout real directamente y Stripe redirige.
  if (config.asesorProStripePriceId) {
    const resultado = await solicitarUpgradePro("Tarjeta (Stripe)");
    if (resultado && "error" in resultado) {
      return (
        <div className="mx-auto max-w-md space-y-4">
          <Link href="/asesor/ajustes" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver a Configuración
          </Link>
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {resultado.error}
          </p>
        </div>
      );
    }
  }

  const admin = createAdminClient();
  const { data: pedidoPendiente } = await admin
    .from("pedidos")
    .select("id, metodo_pago, creado_en")
    .eq("tenant_id", usuario.tenant_id)
    .eq("estado", "iniciado")
    .maybeSingle();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link href="/asesor/ajustes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a Configuración
      </Link>

      <div className="space-y-4 rounded-lg border p-5">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          <h1 className="text-xl font-semibold">Cambiar a Asesor PRO</h1>
        </div>
        <p className="text-2xl font-semibold">
          {formatearPrecio(config.asesorProPrecio, await monedaVisitante())}
          <span className="text-sm font-normal text-muted-foreground">/mes</span>
        </p>

        {pedidoPendiente ? (
          <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
            <Clock className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Pago en revisión</p>
              <p className="mt-1 text-xs">
                Registramos tu solicitud por {pedidoPendiente.metodo_pago} el{" "}
                {new Date(pedidoPendiente.creado_en).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                })}
                . En cuanto confirmemos el pago, tu plan pasará a PRO automáticamente.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
              Todavía no hay una pasarela de pago automática conectada. Elige cómo vas a pagar y
              confirma la solicitud — activaremos tu plan PRO en cuanto verifiquemos el pago.
            </p>
            <ConfirmarPago />
          </>
        )}
      </div>
    </div>
  );
}
