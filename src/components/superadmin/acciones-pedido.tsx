"use client";

import { useTransition } from "react";
import { confirmarPedido, cancelarPedido } from "@/app/superadmin/pedidos/actions";

export function AccionesPedido({ pedidoId }: { pedidoId: string }) {
  const [pending, startTransition] = useTransition();

  function confirmar() {
    if (!window.confirm("¿Confirmas que este pago se ha recibido de verdad? Esto activará el plan del cliente.")) {
      return;
    }
    startTransition(async () => {
      await confirmarPedido(pedidoId);
    });
  }

  function cancelar() {
    if (!window.confirm("¿Cancelar este pedido? El cliente no obtendrá el plan.")) return;
    startTransition(async () => {
      await cancelarPedido(pedidoId);
    });
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={confirmar}
        className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        Marcar como pagado
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={cancelar}
        className="rounded-md border px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        Cancelar
      </button>
    </div>
  );
}
