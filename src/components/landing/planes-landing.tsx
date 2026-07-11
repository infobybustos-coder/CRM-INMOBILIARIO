"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, UserRound, Building2 } from "lucide-react";
import { type TipoPlan, type ConfigPlanes } from "@/lib/planes";
import { cn } from "@/lib/utils";

export function PlanesLanding({ config, moneda }: { config: ConfigPlanes; moneda: "EUR" | "USD" }) {
  const [tipo, setTipo] = useState<TipoPlan>("asesor");
  const simbolo = moneda === "USD" ? "$" : "€";
  const formatearPrecio = (n: number) => `${n.toFixed(2).replace(".", ",")}${simbolo}`;

  const planes: Record<TipoPlan, { gratis: string[]; pago: string[]; precioPago: number }> = {
    asesor: {
      gratis: [
        `Hasta ${config.asesorFree.propietarios} propietarios`,
        `Hasta ${config.asesorFree.inmuebles} inmuebles`,
        `Hasta ${config.asesorFree.compradores} compradores`,
        "Agenda y tareas",
      ],
      pago: [
        "Propietarios ilimitados",
        "Inmuebles ilimitados",
        "Compradores ilimitados",
        "Rendimiento personal",
      ],
      precioPago: config.asesorProPrecio,
    },
    inmobiliaria: {
      gratis: [
        `Hasta ${config.inmobiliariaFree.propietarios} propietarios`,
        `Hasta ${config.inmobiliariaFree.inmuebles} inmuebles`,
        `Hasta ${config.inmobiliariaFree.compradores} compradores`,
        `${config.inmobiliariaFree.administradores} administrador, ${config.inmobiliariaFree.asesores} asesores`,
      ],
      pago: [
        "Propietarios, inmuebles y compradores ilimitados",
        `${config.inmobiliariaProAdminsIncluidos} administradores y ${config.inmobiliariaProAsesoresIncluidos} asesores incluidos`,
        `Asesor adicional: ${formatearPrecio(config.precioAsesorExtra)}/mes`,
        `Administrador adicional: ${formatearPrecio(config.precioAdminExtra)}/mes`,
      ],
      precioPago: config.inmobiliariaProPrecio,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            type="button"
            onClick={() => setTipo("asesor")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tipo === "asesor" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <UserRound className="size-4" /> Asesor independiente
          </button>
          <button
            type="button"
            onClick={() => setTipo("inmobiliaria")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tipo === "inmobiliaria" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <Building2 className="size-4" /> Inmobiliaria
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border p-6">
          <div>
            <h3 className="font-semibold">Gratis</h3>
            <p className="mt-1 text-3xl font-semibold">{`0${simbolo}`}</p>
          </div>
          <ul className="flex-1 space-y-2 text-sm">
            {planes[tipo].gratis.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {c}
              </li>
            ))}
          </ul>
          <Link
            href={`/signup?tipo=${tipo}`}
            className="rounded-md border px-4 py-2 text-center text-sm font-medium hover:bg-accent"
          >
            Empezar gratis
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-primary bg-primary/5 p-6">
          <div>
            <h3 className="font-semibold">PRO</h3>
            <p className="mt-1 text-3xl font-semibold">
              {formatearPrecio(planes[tipo].precioPago)}
              <span className="text-sm font-normal text-muted-foreground">/mes</span>
            </p>
          </div>
          <ul className="flex-1 space-y-2 text-sm">
            {planes[tipo].pago.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {c}
              </li>
            ))}
          </ul>
          <Link
            href={`/signup?tipo=${tipo}`}
            className="rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Elegir PRO
          </Link>
        </div>
      </div>
    </div>
  );
}
