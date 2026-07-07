"use client";

import { useState, useTransition } from "react";
import { eliminarTenant } from "@/app/superadmin/clientes/actions";

export function EliminarTenantBoton({ tenantId, nombreTenant }: { tenantId: string; nombreTenant: string }) {
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [pending, startTransition] = useTransition();

  function eliminar() {
    startTransition(async () => {
      await eliminarTenant(tenantId, confirmacion);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
      >
        Eliminar
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-5 shadow-2xl">
            <h2 className="font-semibold text-destructive">Eliminar cliente</h2>
            <p className="text-sm text-muted-foreground">
              Esto borra el tenant y TODOS sus datos (propietarios, inmuebles, compradores, usuarios...) de
              forma permanente. No se puede deshacer.
            </p>
            <p className="text-sm">
              Escribe <span className="font-semibold">{nombreTenant}</span> para confirmar:
            </p>
            <input
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending || confirmacion !== nombreTenant}
                onClick={eliminar}
                className="flex-1 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending ? "Eliminando..." : "Eliminar definitivamente"}
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
