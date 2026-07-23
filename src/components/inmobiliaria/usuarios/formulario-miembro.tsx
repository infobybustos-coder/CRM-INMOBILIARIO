"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  actualizarMiembro,
  type ActualizarMiembroState,
  type RolInvitable,
} from "@/app/inmobiliaria/equipo/actions";

export function FormularioMiembro({
  id,
  rol,
  activo,
  esUsuarioActual,
}: {
  id: string;
  rol: string;
  activo: boolean;
  esUsuarioActual: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActualizarMiembroState, FormData>(
    actualizarMiembro.bind(null, id),
    null
  );
  const [rolElegido, setRolElegido] = useState<RolInvitable>(rol === "admin" ? "admin" : "empleado");
  const [activoElegido, setActivoElegido] = useState(activo);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Rol y estado</h2>

      <input type="hidden" name="rol" value={rolElegido} />
      <input type="hidden" name="activo" value={activoElegido ? "true" : "false"} />

      <div className="space-y-2">
        <label htmlFor="rol-miembro" className="text-sm font-medium">
          Rol asignado
        </label>
        <select
          id="rol-miembro"
          value={rolElegido}
          disabled={esUsuarioActual}
          onChange={(e) => setRolElegido(e.target.value as RolInvitable)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="empleado">Asesor</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={activoElegido}
          disabled={esUsuarioActual}
          onChange={(e) => setActivoElegido(e.target.checked)}
          className="size-4 rounded border"
        />
        Cuenta activa
      </label>

      {esUsuarioActual && (
        <p className="text-xs text-muted-foreground">
          No puedes cambiar tu propio rol ni desactivar tu propia cuenta.
        </p>
      )}

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      {state && "ok" in state && <p className="text-sm text-emerald-600">Guardado.</p>}

      <Button type="submit" size="sm" disabled={pending || esUsuarioActual}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
