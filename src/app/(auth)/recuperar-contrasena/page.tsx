"use client";

import Link from "next/link";
import { useActionState } from "react";
import { solicitarRecuperacion } from "../actions";
import { Button } from "@/components/ui/button";

export default function RecuperarContrasenaPage() {
  const [state, formAction, pending] = useActionState(solicitarRecuperacion, null);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">Recuperar contraseña</h1>

        {state && "ok" in state ? (
          <p className="text-sm text-emerald-600">
            Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu
            contraseña. Revisa tu correo (y la carpeta de spam).
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escribe el email de tu cuenta y te enviaremos un enlace para poner una contraseña
              nueva.
            </p>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
