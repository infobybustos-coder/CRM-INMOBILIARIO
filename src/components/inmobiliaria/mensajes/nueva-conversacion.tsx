"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { estaConectado } from "@/lib/actividad-tiempo";
import { obtenerCompaneros, crearConversacion } from "@/app/inmobiliaria/mensajes/actions";
import { BuscadorCrm } from "./buscador-crm";
import { ICONO_ENTIDAD } from "./tarjeta-entidad";
import type { Companero, ResultadoBusqueda } from "@/lib/mensajes/tipos";

export function NuevaConversacionBoton() {
  const [abierto, setAbierto] = useState(false);
  const [companeros, setCompaneros] = useState<Companero[] | null>(null);
  const [companeroId, setCompaneroId] = useState<string | null>(null);
  const [entidad, setEntidad] = useState<ResultadoBusqueda | null>(null);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (abierto && companeros === null) {
      obtenerCompaneros().then(setCompaneros);
    }
  }, [abierto, companeros]);

  async function crear() {
    if (!companeroId) return;
    setCreando(true);
    setError(null);
    const resultado = await crearConversacion(companeroId, entidad?.entidadTipo, entidad?.entidadId);
    setCreando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setAbierto(false);
    setCompaneroId(null);
    setEntidad(null);
    router.push(`/inmobiliaria/mensajes?c=${resultado.conversacionId}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <MessageSquarePlus className="size-4" /> Nueva conversación
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold">Nueva conversación</h2>
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
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Con quién quieres hablar</p>
                {companeros === null ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : companeros.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay más miembros en tu equipo todavía.</p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {companeros.map((c) => {
                      const conectado = estaConectado(c.ultimaActividad);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCompaneroId(c.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-sm hover:bg-accent",
                            companeroId === c.id && "border-primary bg-primary/5"
                          )}
                        >
                          <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                            {c.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.avatarUrl} alt="" className="size-full object-cover" />
                            ) : (
                              c.nombreCompleto.slice(0, 2).toUpperCase()
                            )}
                            <span
                              className={cn(
                                "absolute right-0 bottom-0 size-2 rounded-full border border-card",
                                conectado ? "bg-emerald-500" : "bg-muted-foreground/30"
                              )}
                            />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{c.nombreCompleto}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Vincular a un elemento del CRM (opcional)</p>
                {entidad ? (
                  <div className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      {(() => {
                        const Icon = ICONO_ENTIDAD[entidad.entidadTipo];
                        return <Icon className="size-4 shrink-0 text-muted-foreground" />;
                      })()}
                      <span className="truncate">{entidad.titulo}</span>
                    </span>
                    <button type="button" onClick={() => setEntidad(null)} aria-label="Quitar">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : mostrarBuscador ? (
                  <div className="h-48 rounded-md border">
                    <BuscadorCrm
                      onSeleccionar={(r) => {
                        setEntidad(r);
                        setMostrarBuscador(false);
                      }}
                      onCerrar={() => setMostrarBuscador(false)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMostrarBuscador(true)}
                    className="w-full rounded-md border border-dashed px-2.5 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
                  >
                    + Elegir inmueble, propietario, comprador, visita o tarea
                  </button>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="border-t p-4">
              <button
                type="button"
                onClick={crear}
                disabled={!companeroId || creando}
                className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {creando ? "Creando..." : "Crear conversación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
