"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { reenviarCorreoRegistro } from "@/app/superadmin/correos/actions";
import { cn } from "@/lib/utils";
import type { RegistroCorreo } from "@/lib/correos/tipos";

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  enviado: { texto: "Enviado", clase: "bg-emerald-500/10 text-emerald-600" },
  fallido: { texto: "Fallido", clase: "bg-destructive/10 text-destructive" },
  omitido: { texto: "Omitido (plantilla inactiva)", clase: "bg-muted text-muted-foreground" },
};

const NOMBRES_PLANTILLA: Record<string, string> = {
  bienvenida: "Bienvenida",
  limite_aviso: "Aviso de límite",
  limite_alcanzado: "Límite alcanzado",
  recuperar_password: "Recuperación de contraseña",
  password_cambiada: "Contraseña cambiada",
  cambio_plan: "Cambio de plan",
  cancelacion_plan: "Cancelación de suscripción",
  verificacion_email: "Verificación de email",
};

export function RegistroCorreos({ registros }: { registros: RegistroCorreo[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  function reenviar(id: string) {
    setPendingId(id);
    setResultados((r) => ({ ...r, [id]: "" }));
    startTransition(async () => {
      const resultado = await reenviarCorreoRegistro(id);
      setPendingId(null);
      setResultados((r) => ({
        ...r,
        [id]: "error" in resultado ? resultado.error : "Reenviado correctamente.",
      }));
    });
  }

  if (registros.length === 0) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        Todavía no hay correos registrados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-3 py-2 font-medium">Fecha</th>
            <th className="px-3 py-2 font-medium">Destinatario</th>
            <th className="px-3 py-2 font-medium">Plantilla</th>
            <th className="px-3 py-2 font-medium">Asunto</th>
            <th className="px-3 py-2 font-medium">Estado</th>
            <th className="px-3 py-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {registros.map((r) => {
            const estado = ETIQUETA_ESTADO[r.estado] ?? ETIQUETA_ESTADO.fallido;
            return (
              <tr key={r.id}>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {new Date(r.creadoEn).toLocaleString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2">{r.destinatario}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {NOMBRES_PLANTILLA[r.plantillaClave] ?? r.plantillaClave}
                  {r.esReenvio && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground/70">
                      (reenviado{r.reenviadoPor ? ` por ${r.reenviadoPor}` : ""})
                    </span>
                  )}
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-muted-foreground" title={r.asunto}>
                  {r.asunto}
                </td>
                <td className="px-3 py-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estado.clase)}>
                    {estado.texto}
                  </span>
                  {r.error && (
                    <p className="mt-0.5 max-w-xs truncate text-[10px] text-destructive/80" title={r.error}>
                      {r.error}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    disabled={pendingId === r.id}
                    onClick={() => reenviar(r.id)}
                    className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                  >
                    <RefreshCw className={cn("size-3", pendingId === r.id && "animate-spin")} />
                    {pendingId === r.id ? "Reenviando..." : "Reenviar"}
                  </button>
                  {resultados[r.id] && (
                    <p className="mt-1 text-[10px] text-muted-foreground">{resultados[r.id]}</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
