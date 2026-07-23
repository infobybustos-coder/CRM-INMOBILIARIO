"use client";

import { useTransition } from "react";
import { Mail, X } from "lucide-react";
import { cancelarInvitacion } from "@/app/inmobiliaria/equipo/actions";

export type InvitacionPendiente = {
  id: string;
  email: string;
  creadoEn: string;
  expiraEn: string;
};

export function InvitacionesPendientes({ invitaciones }: { invitaciones: InvitacionPendiente[] }) {
  const [pending, startTransition] = useTransition();

  if (invitaciones.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-500">
        <Mail className="size-4" /> Invitaciones pendientes ({invitaciones.length})
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Ocupan un asiento de tu plan aunque todavía no hayan aceptado la invitación.
      </p>
      <ul className="mt-3 space-y-1.5">
        {invitaciones.map((inv) => (
          <li
            key={inv.id}
            className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <span className="truncate">{inv.email}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => cancelarInvitacion(inv.id))}
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <X className="size-3.5" /> Cancelar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
