import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { PRECIO_MENSUAL } from "@/lib/planes";
import { ConfirmarPago } from "@/components/asesor/suscripcion/confirmar-pago";

export default async function PagoPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");
  if (usuario.tenant?.plan_tarifa === "pago") redirect("/asesor/ajustes");

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
          {PRECIO_MENSUAL.asesor.toFixed(2).replace(".", ",")}€
          <span className="text-sm font-normal text-muted-foreground">/mes</span>
        </p>
        <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
          La pasarela de pago todavía no está integrada. Al confirmar, tu plan pasará a PRO sin
          ningún cobro real; el cobro automático se añadirá más adelante.
        </p>
        <ConfirmarPago />
      </div>
    </div>
  );
}
