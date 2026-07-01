"use client";

import { useActionState } from "react";
import { cambiarRolMiembro, alternarActivoMiembro, type GestionMiembroState } from "./actions";

const ROLES = ["administrador", "director_comercial", "agente", "captador"] as const;
const ETIQUETAS_ROL: Record<string, string> = {
  administrador: "Administrador",
  director_comercial: "Director Comercial",
  agente: "Agente",
  captador: "Captador",
};

type Miembro = {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean | null;
};

export function FilaMiembro({
  miembro,
  esMiMismoId,
}: {
  miembro: Miembro;
  esMiMismoId: boolean;
}) {
  const [stateRol, formActionRol] = useActionState<GestionMiembroState, FormData>(
    cambiarRolMiembro,
    null
  );
  const [stateActivo, formActionActivo] = useActionState<GestionMiembroState, FormData>(
    alternarActivoMiembro,
    null
  );

  const activo = miembro.activo !== false;

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2">
        <span className={activo ? "" : "text-muted-foreground line-through"}>
          {miembro.nombre_completo}
        </span>
      </td>
      <td className="px-4 py-2 text-muted-foreground">{miembro.email}</td>
      <td className="px-4 py-2">
        {esMiMismoId ? (
          <span>{ETIQUETAS_ROL[miembro.rol] ?? miembro.rol}</span>
        ) : (
          <form action={formActionRol} className="inline">
            <input type="hidden" name="miembro_id" value={miembro.id} />
            <select
              name="rol"
              defaultValue={miembro.rol}
              onChange={(e) => {
                const form = e.currentTarget.form;
                if (form) form.requestSubmit();
              }}
              className="rounded border bg-background px-2 py-1 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ETIQUETAS_ROL[r]}
                </option>
              ))}
            </select>
            {stateRol && "error" in stateRol && (
              <span className="ml-2 text-xs text-destructive">{stateRol.error}</span>
            )}
          </form>
        )}
      </td>
      <td className="px-4 py-2">
        {esMiMismoId ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <form action={formActionActivo} className="inline">
            <input type="hidden" name="miembro_id" value={miembro.id} />
            <input type="hidden" name="activo" value={activo ? "false" : "true"} />
            <button
              type="submit"
              className={
                activo
                  ? "rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground hover:bg-accent"
              }
            >
              {activo ? "Activo" : "Inactivo"}
            </button>
            {stateActivo && "error" in stateActivo && (
              <span className="ml-2 text-xs text-destructive">{stateActivo.error}</span>
            )}
          </form>
        )}
      </td>
    </tr>
  );
}
