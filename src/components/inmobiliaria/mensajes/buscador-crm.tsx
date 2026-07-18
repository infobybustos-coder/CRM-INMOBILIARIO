"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { buscarEntidades } from "@/app/inmobiliaria/mensajes/actions";
import { ICONO_ENTIDAD } from "./tarjeta-entidad";
import type { ResultadoBusqueda } from "@/lib/mensajes/tipos";

// Tipo MIME propio para distinguir, al soltar, si lo arrastrado es una
// tarjeta del CRM (de este buscador) o un archivo real del sistema.
export const MIME_TARJETA_ARRASTRE = "application/x-ambraio-tarjeta";

export function BuscadorCrm({
  onSeleccionar,
  onCerrar,
}: {
  onSeleccionar: (r: ResultadoBusqueda) => void;
  onCerrar?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const temporizador = setTimeout(async () => {
      setCargando(true);
      const r = await buscarEntidades(query);
      if (!cancelado) {
        setResultados(r);
        setCargando(false);
      }
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar inmuebles, propietarios, compradores, visitas, tareas..."
            className="w-full rounded-md border bg-background py-1.5 pr-2 pl-8 text-sm"
          />
        </div>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar buscador"
            className="rounded-md p-1.5 hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {cargando ? (
          <p className="p-4 text-center text-xs text-muted-foreground">Buscando...</p>
        ) : resultados.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            {query ? "Sin resultados." : "Escribe para buscar, o arrastra un resultado al chat."}
          </p>
        ) : (
          resultados.map((r) => {
            const Icon = ICONO_ENTIDAD[r.entidadTipo];
            return (
              <button
                key={`${r.entidadTipo}-${r.entidadId}`}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(MIME_TARJETA_ARRASTRE, JSON.stringify(r));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onSeleccionar(r)}
                className="flex w-full cursor-grab items-center gap-2 rounded-md border px-2.5 py-2 text-left text-sm hover:bg-accent active:cursor-grabbing"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.titulo}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.subtitulo}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
