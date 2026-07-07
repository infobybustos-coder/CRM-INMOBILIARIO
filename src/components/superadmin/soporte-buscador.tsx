"use client";

import { useActionState } from "react";
import { buscarUsuario } from "@/app/superadmin/soporte/actions";

export function SoporteBuscador() {
  const [resultados, formAction, pending] = useActionState(buscarUsuario, []);

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex gap-2">
        <input
          name="query"
          type="text"
          placeholder="Email, teléfono o nombre..."
          required
          className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {resultados.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Teléfono</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Tenant</th>
                <th className="px-3 py-2 font-medium">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {resultados.map((u) => (
                <tr key={u.usuarioId}>
                  <td className="px-3 py-2 font-medium">{u.nombreCompleto}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.telefono ?? "—"}</td>
                  <td className="px-3 py-2 capitalize text-muted-foreground">{u.rol}</td>
                  <td className="px-3 py-2">{u.tenantNombre}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {u.planTarifa === "pago" ? "PRO" : "Gratis"} ({u.tipoPlan})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
