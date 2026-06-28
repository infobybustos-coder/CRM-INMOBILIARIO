"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "../actions";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6"
      >
        <h1 className="text-xl font-semibold">Crea tu cuenta</h1>

        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">
            Tu nombre o el de la inmobiliaria
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

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
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

        <div className="space-y-2">
          <label htmlFor="pais" className="text-sm font-medium">
            País
          </label>
          <select
            id="pais"
            defaultValue="ES"
            disabled
            className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
          >
            <option value="ES">España</option>
          </select>
          <input type="hidden" name="pais" value="ES" />
          <p className="text-xs text-muted-foreground">
            Por ahora solo disponible para España. Pronto añadiremos más países.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Tipo de cuenta</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tipo_plan"
              value="asesor"
              defaultChecked
            />
            Asesor individual
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="tipo_plan" value="inmobiliaria" />
            Inmobiliaria (equipo)
          </label>
        </fieldset>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creando..." : "Crear cuenta"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
