"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { estaConectado } from "@/lib/actividad-tiempo";
import type { ConversacionConParticipante, EntidadCompartible } from "@/lib/mensajes/tipos";
import { ICONO_ENTIDAD } from "./tarjeta-entidad";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function fecha(valor: string) {
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function EtiquetaEntidad({ tipo, titulo }: { tipo: EntidadCompartible; titulo: string }) {
  const Icon = ICONO_ENTIDAD[tipo];
  return (
    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
      <Icon className="size-3 shrink-0" />
      <span className="truncate">{titulo}</span>
    </p>
  );
}

export function ListaConversaciones({
  conversaciones,
  seleccionadaId,
}: {
  conversaciones: ConversacionConParticipante[];
  seleccionadaId?: string;
}) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return conversaciones;
    return conversaciones.filter(
      (c) => c.otroNombre.toLowerCase().includes(texto) || (c.entidadTitulo ?? "").toLowerCase().includes(texto)
    );
  }, [conversaciones, busqueda]);

  return (
    <div className="flex w-80 shrink-0 flex-col border-r">
      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="w-full rounded-md border bg-background py-1.5 pr-2 pl-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 divide-y overflow-y-auto">
        {filtradas.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {conversaciones.length === 0 ? "Todavía no tienes conversaciones." : "Nada coincide con tu búsqueda."}
          </p>
        ) : (
          filtradas.map((c) => {
            const conectado = estaConectado(c.otroUltimaActividad);
            return (
              <Link
                key={c.id}
                href={`/inmobiliaria/mensajes?c=${c.id}`}
                className={cn(
                  "flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-accent/60",
                  seleccionadaId === c.id && "bg-accent"
                )}
              >
                <div className="relative shrink-0">
                  <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {c.otroAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.otroAvatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      iniciales(c.otroNombre)
                    )}
                  </div>
                  <span
                    className={cn(
                      "absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-background",
                      conectado ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-sm", c.sinLeer ? "font-semibold" : "font-medium")}>
                      {c.otroNombre}
                    </p>
                    {c.ultimoMensajeEn && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">{fecha(c.ultimoMensajeEn)}</span>
                    )}
                  </div>
                  {c.entidadTipo && c.entidadTitulo && (
                    <EtiquetaEntidad tipo={c.entidadTipo} titulo={c.entidadTitulo} />
                  )}
                  <p
                    className={cn(
                      "truncate text-xs",
                      c.sinLeer ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {c.ultimoMensaje ?? "Sin mensajes todavía"}
                  </p>
                </div>
                {c.sinLeer && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
