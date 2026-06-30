"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import { signUp } from "../actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TipoPlan = "asesor" | "inmobiliaria";

const PLANES_PAGO: Record<TipoPlan, { nombre: string; precio: string }> = {
  asesor: { nombre: "Asesor", precio: "9,99€/mes" },
  inmobiliaria: { nombre: "Inmobiliaria", precio: "19,99€/mes" },
};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, null);
  const [tipoPlan, setTipoPlan] = useState<TipoPlan>("asesor");
  const [planTarifa, setPlanTarifa] = useState<"gratis" | "pago">("gratis");

  const planPago = PLANES_PAGO[tipoPlan];

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6"
      >
        <h1 className="text-xl font-semibold">Crea tu cuenta</h1>

        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">
            Tu nombre o el de la inmobiliaria
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="pais" className="text-sm font-medium">
            País
          </label>
          <select
            id="pais"
            defaultValue="ES"
            disabled
            className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
          >
            <option value="ES">España</option>
          </select>
          <input type="hidden" name="pais" value="ES" />
          <p className="text-xs text-muted-foreground">
            Por ahora solo disponible para España. Pronto añadiremos más países.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Tipo de cuenta</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tipo_plan"
              value="asesor"
              checked={tipoPlan === "asesor"}
              onChange={() => setTipoPlan("asesor")}
            />
            Asesor/a individual
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tipo_plan"
              value="inmobiliaria"
              checked={tipoPlan === "inmobiliaria"}
              onChange={() => setTipoPlan("inmobiliaria")}
            />
            Inmobiliaria (equipo)
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Elige tu plan</legend>
          <input type="hidden" name="plan_tarifa" value={planTarifa} />

          <button
            type="button"
            onClick={() => setPlanTarifa("gratis")}
            className={cn(
              "w-full rounded-md border p-3 text-left text-sm transition-colors",
              planTarifa === "gratis" ? "border-primary bg-primary/5" : "hover:bg-accent"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Gratis</span>
              <span className="font-semibold">0€/mes</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Hasta 3 captaciones, 3 inmuebles y 2 compradores.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPlanTarifa("pago")}
            className={cn(
              "w-full rounded-md border p-3 text-left text-sm transition-colors",
              planTarifa === "pago" ? "border-primary bg-primary/5" : "hover:bg-accent"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{planPago.nombre}</span>
              <span className="font-semibold">{planPago.precio}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Captaciones, inmuebles y compradores ilimitados.
              {tipoPlan === "inmobiliaria" &&
                " Incluye 2 asesores; desde el 3º, 7,99€/mes cada uno."}
            </p>
          </button>
        </fieldset>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creando..." : "Crear cuenta"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
