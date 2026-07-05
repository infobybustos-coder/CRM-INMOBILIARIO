"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cambiarPlanTarifa } from "@/app/asesor/suscripcion/actions";

export function ConfirmarPago() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const resultado = await cambiarPlanTarifa("pago");
      if ("error" in resultado) {
        setError(resultado.error);
        return;
      }
      router.push("/asesor/ajustes");
    });
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={confirmar}
        disabled={pending}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Confirmando..." : "Confirmar cambio a PRO"}
      </button>
    </div>
  );
}
