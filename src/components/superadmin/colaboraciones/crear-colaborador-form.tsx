"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { crearColaborador, type CrearColaboradorState } from "@/app/superadmin/colaboraciones/actions";

export function CrearColaboradorForm() {
  const [state, formAction, pending] = useActionState<CrearColaboradorState, FormData>(crearColaborador, null);
  const [copiadoCodigo, setCopiadoCodigo] = useState(false);
  const [copiadoEnlace, setCopiadoEnlace] = useState(false);

  if (state && "ok" in state) {
    return (
      <div className="max-w-md space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Colaborador creado</h2>
        <p className="text-sm text-muted-foreground">
          Le hemos mandado un email para que configure su contraseña y entre a su panel.
        </p>

        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Código de referido</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={state.codigo}
                className="w-full min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(state.codigo);
                  setCopiadoCodigo(true);
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
                aria-label="Copiar código"
              >
                {copiadoCodigo ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Enlace de referido</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={state.enlace}
                className="w-full min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(state.enlace);
                  setCopiadoEnlace(true);
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
                aria-label="Copiar enlace"
              >
                {copiadoEnlace ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/superadmin/colaboraciones"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Volver a Colaboraciones
          </Link>
          <Link
            href="/superadmin/colaboraciones/nuevo"
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Crear otro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-lg border p-6">
      <div className="space-y-2">
        <label htmlFor="nombre" className="text-sm font-medium">
          Nombre
        </label>
        <input id="nombre" name="nombre" required className="w-full rounded-md border px-3 py-2 text-sm" />
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
        <label htmlFor="codigo_referido" className="text-sm font-medium">
          Código de referido
        </label>
        <input
          id="codigo_referido"
          name="codigo_referido"
          placeholder="Déjalo vacío para generarlo automáticamente"
          className="w-full rounded-md border px-3 py-2 text-sm uppercase placeholder:normal-case"
        />
        <p className="text-xs text-muted-foreground">
          Solo letras y números. Ejemplos: JOSE10, INMO2026, AMBRAIO001, MARTA.
        </p>
      </div>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear colaborador"}
      </button>
    </form>
  );
}
