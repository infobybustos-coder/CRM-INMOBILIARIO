"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { solicitarUpgradePro } from "@/app/asesor/suscripcion/actions";
import { METODOS_PAGO } from "@/lib/metodos-pago";

export function ConfirmarPago() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<string>(METODOS_PAGO[0]);

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const resultado = await solicitarUpgradePro(metodoPago);
      if ("error" in resultado) {
        setError(resultado.error);
        return;
      }
      router.push("/asesor/ajustes");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="metodo_pago" className="text-sm font-medium">
          ¿Cómo vas a pagar?
        </label>
        <select
          id="metodo_pago"
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={confirmar}
        disabled={pending}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Solicitar cambio a PRO"}
      </button>
    </div>
  );
}
