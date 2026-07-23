"use client";

import { useTransition } from "react";
import { borrarHistorialMrr } from "@/app/superadmin/finanzas/actions";

export function BorrarHistorialMrrBoton() {
  const [pending, startTransition] = useTransition();

  function borrar() {
    if (
      !window.confirm(
        "¿Borrar todo el historial de MRR (por ejemplo, el del periodo de pruebas)? No se puede deshacer. La foto de hoy se vuelve a generar sola."
      )
    ) {
      return;
    }
    startTransition(async () => {
      await borrarHistorialMrr();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={borrar}
      className="text-xs text-muted-foreground underline hover:text-destructive disabled:opacity-50"
    >
      {pending ? "Borrando..." : "Borrar historial"}
    </button>
  );
}
