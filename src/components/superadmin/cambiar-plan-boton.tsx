"use client";

import { useState, useTransition } from "react";
import { cambiarPlanTenant } from "@/app/superadmin/clientes/actions";
import { METODOS_PAGO } from "@/lib/metodos-pago";

export function CambiarPlanBoton({
  tenantId,
  tipoPlanActual,
  planTarifaActual,
}: {
  tenantId: string;
  tipoPlanActual: string;
  planTarifaActual: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [tipoPlan, setTipoPlan] = useState<"asesor" | "inmobiliaria">(
    tipoPlanActual === "inmobiliaria" ? "inmobiliaria" : "asesor"
  );
  const [planTarifa, setPlanTarifa] = useState<"gratis" | "pago">(
    planTarifaActual === "pago" ? "pago" : "gratis"
  );
  const [metodoPago, setMetodoPago] = useState<string>(METODOS_PAGO[0]);
  const [pending, startTransition] = useTransition();

  const pasaAPago = planTarifa === "pago" && planTarifaActual !== "pago";

  function guardar() {
    const mensaje = pasaAPago
      ? "¿Confirmas que has recibido el pago de este cliente y quieres activar el plan PRO?"
      : "¿Cambiar el plan de este cliente manualmente?";
    if (!window.confirm(mensaje)) return;
    startTransition(async () => {
      await cambiarPlanTenant(tenantId, tipoPlan, planTarifa, pasaAPago ? metodoPago : undefined);
      setAbierto(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
      >
        Cambiar plan
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-5 shadow-2xl">
            <h2 className="font-semibold">Cambiar plan</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={tipoPlan}
                onChange={(e) => setTipoPlan(e.target.value as "asesor" | "inmobiliaria")}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="asesor">Asesor</option>
                <option value="inmobiliaria">Inmobiliaria</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tarifa</label>
              <select
                value={planTarifa}
                onChange={(e) => setPlanTarifa(e.target.value as "gratis" | "pago")}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="gratis">Gratis</option>
                <option value="pago">PRO</option>
              </select>
            </div>
            {pasaAPago && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Método de pago recibido</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={guardar}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {pending ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
