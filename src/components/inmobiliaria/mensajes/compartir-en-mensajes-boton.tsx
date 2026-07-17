"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { estaConectado } from "@/lib/actividad-tiempo";
import { obtenerCompaneros, obtenerConversaciones, compartirEnMensajes } from "@/app/inmobiliaria/mensajes/actions";
import type { Companero, ConversacionConParticipante, EntidadCompartible } from "@/lib/mensajes/tipos";

export function CompartirEnMensajesBoton({
  entidadTipo,
  entidadId,
}: {
  entidadTipo: EntidadCompartible;
  entidadId: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [conversaciones, setConversaciones] = useState<ConversacionConParticipante[] | null>(null);
  const [companeros, setCompaneros] = useState<Companero[] | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (abierto && conversaciones === null) {
      Promise.all([obtenerConversaciones(), obtenerCompaneros()]).then(([c, u]) => {
        setConversaciones(c);
        setCompaneros(u);
      });
    }
  }, [abierto, conversaciones]);

  async function enviarA(destino: { conversacionId: string } | { usuarioId: string }, claveUi: string) {
    setEnviando(claveUi);
    setError(null);
    const resultado = await compartirEnMensajes(entidadTipo, entidadId, destino);
    setEnviando(null);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setEnviadoA(claveUi);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
      >
        <Share2 className="size-3.5" /> Compartir en Mensajes
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold">Compartir en Mensajes</h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="rounded-full p-1.5 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {conversaciones === null ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (
                <>
                  {conversaciones.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Conversaciones existentes</p>
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {conversaciones.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => enviarA({ conversacionId: c.id }, c.id)}
                            disabled={enviando === c.id}
                            className="flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                          >
                            <span className="truncate">{c.otroNombre}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {enviadoA === c.id ? "Enviado ✓" : enviando === c.id ? "Enviando..." : "Compartir"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Nueva conversación con</p>
                    {companeros === null || companeros.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay más miembros en tu equipo todavía.</p>
                    ) : (
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {companeros.map((u) => {
                          const conectado = estaConectado(u.ultimaActividad);
                          const clave = `nuevo-${u.id}`;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => enviarA({ usuarioId: u.id }, clave)}
                              disabled={enviando === clave}
                              className="flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span
                                  className={cn(
                                    "size-1.5 shrink-0 rounded-full",
                                    conectado ? "bg-emerald-500" : "bg-muted-foreground/30"
                                  )}
                                />
                                {u.nombreCompleto}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {enviadoA === clave ? "Enviado ✓" : enviando === clave ? "Enviando..." : "Compartir"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {enviadoA && (
                <button
                  type="button"
                  onClick={() => router.push("/inmobiliaria/mensajes")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver en Mensajes →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
