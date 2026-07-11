"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cambiarPlanTarifa } from "@/app/inmobiliaria/suscripcion/actions";
import { type PlanTarifa, type ConfigPlanes } from "@/lib/planes";
import { formatearPrecio } from "@/lib/precio";
import { cn } from "@/lib/utils";

export function SelectorPlan({
  planActual,
  config,
  pedidoPendiente,
  moneda,
}: {
  planActual: PlanTarifa;
  config: ConfigPlanes;
  pedidoPendiente?: boolean;
  moneda: "EUR" | "USD";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const planes: { valor: PlanTarifa; nombre: string; precio: number; caracteristicas: string[] }[] = [
    {
      valor: "gratis",
      nombre: "Inmobiliaria Free",
      precio: 0,
      caracteristicas: [
        `Hasta ${config.inmobiliariaFree.propietarios} propietarios`,
        `Hasta ${config.inmobiliariaFree.inmuebles} inmuebles`,
        `Hasta ${config.inmobiliariaFree.compradores} compradores`,
        `${config.inmobiliariaFree.administradores} administrador incluido`,
        `${config.inmobiliariaFree.asesores} asesores incluidos`,
      ],
    },
    {
      valor: "pago",
      nombre: "Inmobiliaria PRO",
      precio: config.inmobiliariaProPrecio,
      caracteristicas: [
        "Propietarios ilimitados",
        "Inmuebles ilimitados",
        "Compradores ilimitados",
        `${config.inmobiliariaProAdminsIncluidos} administradores incluidos`,
        `${config.inmobiliariaProAsesoresIncluidos} asesores incluidos`,
        `Administrador adicional: ${formatearPrecio(config.precioAdminExtra, moneda)}/mes`,
        `Asesor adicional: ${formatearPrecio(config.precioAsesorExtra, moneda)}/mes`,
      ],
    },
  ];

  function elegir(plan: PlanTarifa) {
    if (plan === "pago") {
      router.push("/inmobiliaria/suscripcion/pago");
      return;
    }
    const mensaje =
      "¿Volver al plan Gratis? Si tienes más propietarios, inmuebles o compradores de los permitidos, no podrás crear nuevos hasta bajar de ese límite.";
    if (window.confirm(mensaje)) {
      setError(null);
      startTransition(async () => {
        const resultado = await cambiarPlanTarifa(plan);
        if ("error" in resultado) setError(resultado.error);
      });
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {error && (
        <p className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {planes.map((plan) => {
        const esActual = plan.valor === planActual;
        const esProPendiente = plan.valor === "pago" && pedidoPendiente;
        return (
          <div
            key={plan.valor}
            className={cn(
              "flex flex-col gap-3 rounded-lg border p-4",
              esActual && "border-primary bg-primary/5"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{plan.nombre}</h3>
              {esActual && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Plan actual
                </span>
              )}
              {esProPendiente && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                  Pago en revisión
                </span>
              )}
            </div>
            <p className="text-2xl font-semibold">
              {plan.precio === 0 ? "Gratis" : formatearPrecio(plan.precio, moneda)}
              {plan.precio > 0 && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
            </p>
            <ul className="flex-1 space-y-1.5 text-sm">
              {plan.caracteristicas.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> {c}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={esActual || esProPendiente || pending}
              onClick={() => elegir(plan.valor)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50",
                esActual || esProPendiente
                  ? "border text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {esActual
                ? "Plan actual"
                : esProPendiente
                  ? "Pago en revisión"
                  : pending
                    ? "Cambiando..."
                    : "Cambiar a este plan"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
