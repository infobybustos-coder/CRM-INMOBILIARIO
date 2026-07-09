"use client";

import { useTransition } from "react";
import { cambiarEstadoTenant, type EstadoTenant } from "@/app/superadmin/clientes/actions";
import { CambiarPlanBoton } from "@/components/superadmin/cambiar-plan-boton";

export function AccionesFilaSuscripcion({
  tenantId,
  estado,
  tipoPlan,
  planTarifa,
}: {
  tenantId: string;
  estado: EstadoTenant;
  tipoPlan: string;
  planTarifa: string;
}) {
  const [pending, startTransition] = useTransition();

  function cambiarEstado(nuevo: EstadoTenant, mensaje: string) {
    if (!window.confirm(mensaje)) return;
    startTransition(async () => {
      await cambiarEstadoTenant(tenantId, nuevo);
    });
  }

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
      <CambiarPlanBoton tenantId={tenantId} tipoPlanActual={tipoPlan} planTarifaActual={planTarifa} />
      {estado !== "cancelado" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => cambiarEstado("cancelado", "¿Cancelar la suscripción de este cliente?")}
          className="rounded-md border px-2 py-1 font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          Cancelar
        </button>
      )}
      {estado !== "activo" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => cambiarEstado("activo", "¿Renovar/reactivar la cuenta de este cliente?")}
          className="rounded-md border px-2 py-1 font-medium hover:bg-accent disabled:opacity-50"
        >
          Renovar
        </button>
      )}
    </div>
  );
}
