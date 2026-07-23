"use client";

import { useTransition } from "react";
import { cambiarEstadoTenant, type EstadoTenant } from "@/app/superadmin/clientes/actions";

const CONFIRMACIONES: Record<EstadoTenant, string> = {
  activo: "¿Reactivar esta cuenta? Volverá a tener acceso normal al CRM.",
  suspendido: "¿Suspender esta cuenta? El cliente no podrá entrar al CRM hasta que se reactive.",
  cancelado: "¿Cancelar esta cuenta? Se marcará como cancelada.",
};

export function EstadoTenantAcciones({
  tenantId,
  estadoActual,
}: {
  tenantId: string;
  estadoActual: EstadoTenant;
}) {
  const [pending, startTransition] = useTransition();

  function cambiar(nuevoEstado: EstadoTenant) {
    if (!window.confirm(CONFIRMACIONES[nuevoEstado])) return;
    startTransition(() => {
      cambiarEstadoTenant(tenantId, nuevoEstado);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {estadoActual !== "activo" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => cambiar("activo")}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Reactivar
        </button>
      )}
      {estadoActual !== "suspendido" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => cambiar("suspendido")}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-500/10 disabled:opacity-50"
        >
          Suspender
        </button>
      )}
      {estadoActual !== "cancelado" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => cambiar("cancelado")}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          Cancelar cuenta
        </button>
      )}
    </div>
  );
}
