"use client";

import { useActionState } from "react";
import { restablecerContrasena } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function RestablecerContrasenaForm() {
  const [state, formAction, pending] = useActionState(restablecerContrasena, null);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
      <h1 className="text-xl font-semibold">Pon una contraseña nueva</h1>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña nueva
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con mayúscula, minúscula y número.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="password_confirmacion" className="text-sm font-medium">
          Repite la contraseña
        </label>
        <input
          id="password_confirmacion"
          name="password_confirmacion"
          type="password"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
