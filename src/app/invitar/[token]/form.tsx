"use client";

import { useActionState } from "react";
import { aceptarInvitacion } from "./actions";
import { Button } from "@/components/ui/button";

export function AceptarInvitacionForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(aceptarInvitacion, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <label htmlFor="nombre" className="text-sm font-medium">
          Tu nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Elige una contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando..." : "Unirme al equipo"}
      </Button>
    </form>
  );
}
