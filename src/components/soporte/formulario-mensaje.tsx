"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AdjuntoNuevo } from "@/lib/soporte/tipos";

type EnviarResultado = { error: string } | { ok: true };

export function FormularioMensaje({
  conversacionId,
  onEnviar,
  placeholder = "Escribe tu mensaje...",
}: {
  conversacionId: string;
  onEnviar: (conversacionId: string, contenido: string, adjuntos: AdjuntoNuevo[]) => Promise<EnviarResultado>;
  placeholder?: string;
}) {
  const [contenido, setContenido] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function agregarArchivos(files: FileList | null) {
    if (!files) return;
    setArchivos((prev) => [...prev, ...Array.from(files)]);
  }

  function quitarArchivo(i: number) {
    setArchivos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function enviar() {
    if (!contenido.trim() && archivos.length === 0) return;
    setError(null);
    setSubiendo(true);

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
      setSubiendo(false);
      setError(err instanceof Error ? err.message : "No se pudieron subir los archivos.");
      return;
    }
    setSubiendo(false);

    const contenidoEnviado = contenido;
    setContenido("");
    setArchivos([]);
    if (inputRef.current) inputRef.current.value = "";

    startTransition(async () => {
      const resultado = await onEnviar(conversacionId, contenidoEnviado, adjuntos);
      if ("error" in resultado) setError(resultado.error);
    });
  }

  const ocupado = subiendo || pending;

  return (
    <div className="border-t p-3">
      {archivos.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {archivos.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs"
            >
              {f.name}
              <button type="button" onClick={() => quitarArchivo(i)} aria-label="Quitar archivo">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={ocupado}
          aria-label="Adjuntar archivo"
          className="flex shrink-0 items-center justify-center rounded-md border p-2.5 text-muted-foreground hover:bg-accent disabled:opacity-50"
        >
          <Paperclip className="size-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => agregarArchivos(e.target.files)}
        />
        <input
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder={placeholder}
          disabled={ocupado}
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={ocupado || (!contenido.trim() && archivos.length === 0)}
          aria-label="Enviar mensaje"
          className="flex shrink-0 items-center justify-center rounded-md bg-primary p-2.5 text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
