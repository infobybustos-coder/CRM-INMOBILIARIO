"use client";

import { useState, useTransition } from "react";
import { restablecerContrasenaUsuario } from "@/app/superadmin/clientes/actions";

export function RestablecerPasswordBoton({ usuarioId, tenantId }: { usuarioId: string; tenantId: string }) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<"ok" | "error" | null>(null);

  function enviar() {
    setResultado(null);
    startTransition(async () => {
      const res = await restablecerContrasenaUsuario(usuarioId, tenantId);
      setResultado("error" in res ? "error" : "ok");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={enviar}
        disabled={pending}
        className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Restablecer contraseña"}
      </button>
      {resultado === "ok" && <span className="text-xs text-emerald-600">Correo enviado</span>}
      {resultado === "error" && <span className="text-xs text-destructive">Error al enviar</span>}
    </div>
  );
}
