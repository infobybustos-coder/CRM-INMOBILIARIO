"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { crearConversacion, enviarMensajeCliente } from "@/lib/soporte/actions";
import type { AdjuntoNuevo } from "@/lib/soporte/tipos";

export function NuevaConversacion({ baseHref }: { baseHref: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function cerrar() {
    setAbierto(false);
    setAsunto("");
    setMensaje("");
    setArchivos([]);
    setError(null);
  }

  async function crear() {
    if (!asunto.trim()) {
      setError("Escribe un asunto.");
      return;
    }
    if (!mensaje.trim() && archivos.length === 0) {
      setError("Escribe un mensaje o adjunta un archivo.");
      return;
    }
    setEnviando(true);
    setError(null);

    const resultado = await crearConversacion(asunto);
    if ("error" in resultado) {
      setError(resultado.error);
      setEnviando(false);
      return;
    }
    const { conversacionId } = resultado;

    let adjuntos: AdjuntoNuevo[] = [];
    try {
      const supabase = createClient();
      adjuntos = await Promise.all(
        archivos.map(async (file) => {
          const ruta = `${conversacionId}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage.from("adjuntos_soporte").upload(ruta, file);
          if (uploadError) throw new Error(`No se pudo subir "${file.name}".`);
          return {
            nombreArchivo: file.name,
            urlStorage: ruta,
            tipoMime: file.type || null,
            tamanoBytes: file.size,
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron subir los archivos.");
      setEnviando(false);
      return;
    }

    const envio = await enviarMensajeCliente(conversacionId, mensaje, adjuntos);
    if ("error" in envio) {
      setError(envio.error);
      setEnviando(false);
      return;
    }

    setEnviando(false);
    cerrar();
    router.push(`${baseHref}?c=${conversacionId}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva conversación
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Nueva conversación</h2>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="asunto" className="text-sm font-medium">
                Asunto
              </label>
              <input
                id="asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="¿En qué podemos ayudarte?"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mensaje" className="text-sm font-medium">
                Mensaje
              </label>
              <textarea
                id="mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={4}
                placeholder="Cuéntanos con detalle qué necesitas..."
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                Adjuntar archivos
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setArchivos((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
              />
              {archivos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {archivos.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={() => setArchivos((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Quitar archivo"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="button"
              onClick={crear}
              disabled={enviando}
              className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Iniciar conversación"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
