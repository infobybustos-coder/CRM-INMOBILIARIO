"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { obtenerMensajesNuevos, marcarConversacionLeida } from "@/app/inmobiliaria/mensajes/actions";
import { TarjetaEntidad } from "./tarjeta-entidad";
import type { Mensaje } from "@/lib/mensajes/tipos";

function fechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export function HiloMensajes({
  conversacionId,
  mensajesIniciales,
  miUsuarioId,
  otraUltimaLectura,
}: {
  conversacionId: string;
  mensajesIniciales: Mensaje[];
  miUsuarioId: string;
  otraUltimaLectura: string | null;
}) {
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const ultimoCreadoEnRef = useRef<string | undefined>(mensajesIniciales.at(-1)?.creadoEn);

  // Reajuste durante el render (no en un efecto) al cambiar de
  // conversación — patrón recomendado por React para "resetear estado
  // cuando cambia una prop", en vez de un efecto que sincroniza en cada
  // cambio.
  const [conversacionAnterior, setConversacionAnterior] = useState(conversacionId);
  if (conversacionId !== conversacionAnterior) {
    setConversacionAnterior(conversacionId);
    setMensajes(mensajesIniciales);
  }

  // La ref solo se lee/escribe dentro de efectos, nunca durante el render.
  useEffect(() => {
    ultimoCreadoEnRef.current = mensajes.at(-1)?.creadoEn;
  }, [mensajes]);

  useEffect(() => {
    let cancelado = false;
    const intervalo = setInterval(async () => {
      const nuevos = await obtenerMensajesNuevos(conversacionId, ultimoCreadoEnRef.current);
      if (cancelado || nuevos.length === 0) return;
      setMensajes((prev) => [...prev, ...nuevos]);
      if (nuevos.some((m) => m.autorId !== miUsuarioId)) {
        marcarConversacionLeida(conversacionId);
      }
    }, 4000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [conversacionId, miUsuarioId]);

  useEffect(() => {
    contenedorRef.current?.scrollTo({ top: contenedorRef.current.scrollHeight });
  }, [mensajes]);

  if (mensajes.length === 0) {
    return <p className="flex-1 p-4 text-sm text-muted-foreground">Todavía no hay mensajes. Escribe el primero.</p>;
  }

  let idUltimoPropio: string | null = null;
  for (let i = mensajes.length - 1; i >= 0; i--) {
    if (mensajes[i].autorId === miUsuarioId) {
      idUltimoPropio = mensajes[i].id;
      break;
    }
  }

  return (
    <div ref={contenedorRef} className="flex-1 space-y-3 overflow-y-auto p-4">
      {mensajes.map((m) => {
        const esPropio = m.autorId === miUsuarioId;
        const leido = Boolean(esPropio && otraUltimaLectura && m.creadoEn <= otraUltimaLectura);
        return (
          <div key={m.id} className={cn("flex", esPropio ? "justify-end" : "justify-start")}>
            <div className={cn("flex max-w-[80%] flex-col gap-2", esPropio ? "items-end" : "items-start")}>
              {m.contenido && (
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    esPropio ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.contenido}</p>
                </div>
              )}
              {m.adjuntos.map((a) =>
                a.tipoMime?.startsWith("image/") ? (
                  <a key={a.id} href={a.urlFirmada ?? "#"} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.urlFirmada ?? ""}
                      alt={a.nombreArchivo}
                      className="max-h-48 rounded-md border object-cover"
                    />
                  </a>
                ) : (
                  <a
                    key={a.id}
                    href={a.urlFirmada ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-xs underline underline-offset-2"
                  >
                    <Paperclip className="size-3 shrink-0" />
                    <span className="truncate">{a.nombreArchivo}</span>
                  </a>
                )
              )}
              {m.tarjetas.map((t) => (
                <TarjetaEntidad key={t.id} datos={t.datos} compacta />
              ))}
              <p className={cn("text-[10px] text-muted-foreground", esPropio && "flex items-center gap-1")}>
                {fechaHora(m.creadoEn)}
                {m.id === idUltimoPropio &&
                  (leido ? (
                    <CheckCheck className="size-3 text-sky-500" />
                  ) : (
                    <Check className="size-3" />
                  ))}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
