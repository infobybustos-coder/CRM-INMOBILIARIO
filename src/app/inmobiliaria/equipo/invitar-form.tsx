"use client";

import { useActionState, useState } from "react";
import { crearInvitacion } from "./actions";
import { Button } from "@/components/ui/button";

export function InvitarForm() {
  const [state, formAction, pending] = useActionState(crearInvitacion, null);
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-medium">Invitar a alguien</h2>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-56 rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="rol" className="text-sm font-medium">
            Rol
          </label>
          <select
            id="rol"
            name="rol"
            defaultValue="agente"
            className="w-48 rounded-md border px-3 py-2 text-sm"
          >
            <option value="administrador">Administrador</option>
            <option value="director_comercial">Director Comercial</option>
            <option value="agente">Agente</option>
            <option value="captador">Captador</option>
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creando..." : "Generar enlace"}
        </Button>
      </form>

      {state && "error" in state && (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      )}

      {state && "link" in state && (
        <div className="mt-3 space-y-2">
          <p className="text-sm">
            Comparte este enlace con la persona invitada (válido 7 días):
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={state.link}
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
              onFocus={(e) => e.target.select()}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(state.link);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
            >
              {copiado ? "¡Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
