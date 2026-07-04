"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { cambiarPlanTarifa } from "@/app/inmobiliaria/suscripcion/actions";
import {
  LIMITES_GRATIS,
  PRECIO_MENSUAL,
  ASESORES_INCLUIDOS_INMOBILIARIA,
  ADMINS_INCLUIDOS_INMOBILIARIA,
  type PlanTarifa,
} from "@/lib/planes";
import { cn } from "@/lib/utils";

const PLANES: {
  valor: PlanTarifa;
  nombre: string;
  precio: number;
  caracteristicas: string[];
}[] = [
  {
    valor: "gratis",
    nombre: "Gratis",
    precio: 0,
    caracteristicas: [
      `Hasta ${LIMITES_GRATIS.propietarios} propietarios`,
      `Hasta ${LIMITES_GRATIS.inmuebles} inmuebles`,
      `Hasta ${LIMITES_GRATIS.compradores} compradores`,
      `${ASESORES_INCLUIDOS_INMOBILIARIA} agentes y ${ADMINS_INCLUIDOS_INMOBILIARIA} administradores incluidos`,
    ],
  },
  {
    valor: "pago",
    nombre: "Inmobiliaria",
    precio: PRECIO_MENSUAL.inmobiliaria,
    caracteristicas: [
      "Propietarios ilimitados",
      "Inmuebles ilimitados",
      "Compradores ilimitados",
      `${ASESORES_INCLUIDOS_INMOBILIARIA} agentes y ${ADMINS_INCLUIDOS_INMOBILIARIA} administradores incluidos`,
    ],
  },
];

export function SelectorPlan({ planActual }: { planActual: PlanTarifa }) {
  const [pending, startTransition] = useTransition();

  function elegir(plan: PlanTarifa) {
    const mensaje =
      plan === "pago"
        ? "¿Cambiar al plan de pago (19,99€/mes)? Esto no procesa ningún cobro real todavía: solo actualiza tu plan en el CRM."
        : "¿Volver al plan Gratis? Si tienes más propietarios, inmuebles o compradores de los permitidos, no podrás crear nuevos hasta bajar de ese límite.";
    if (window.confirm(mensaje)) {
      startTransition(() => cambiarPlanTarifa(plan));
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PLANES.map((plan) => {
        const esActual = plan.valor === planActual;
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
            </div>
            <p className="text-2xl font-semibold">
              {plan.precio === 0 ? "Gratis" : `${plan.precio.toFixed(2).replace(".", ",")}€`}
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
              disabled={esActual || pending}
              onClick={() => elegir(plan.valor)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50",
                esActual
                  ? "border text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {esActual ? "Plan actual" : pending ? "Cambiando..." : "Cambiar a este plan"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
