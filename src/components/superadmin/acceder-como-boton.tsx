"use client";

import { useTransition } from "react";
import { entrarComoUsuario } from "@/app/superadmin/clientes/impersonar-actions";

export function AccederComoBoton({ usuarioId, nombre }: { usuarioId: string; nombre: string }) {
  const [pending, startTransition] = useTransition();

  function entrar() {
    if (
      !window.confirm(
        `¿Acceder como ${nombre}? Verás el CRM exactamente como lo ve esta persona, para dar soporte. Podrás volver a tu sesión de superadmin en cualquier momento.`
      )
    )
      return;
    startTransition(async () => {
      await entrarComoUsuario(usuarioId);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={entrar}
      className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Entrando..." : "Acceder como usuario"}
    </button>
  );
}
