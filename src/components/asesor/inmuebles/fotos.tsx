"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarFoto, eliminarFoto } from "@/app/asesor/inmuebles/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Foto } from "@/app/asesor/inmuebles/constantes";

export function Fotos({
  inmuebleId,
  tenantId,
  fotos,
}: {
  inmuebleId: string;
  tenantId: string;
  fotos: Foto[];
}) {
  const [lista, setLista] = useState(fotos);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pendientes = lista.filter((f) => !urls[f.url_storage]);
    if (pendientes.length === 0) return;

    const supabase = createClient();
    let cancelado = false;

    Promise.all(
      pendientes.map(async (f) => {
        const { data } = await supabase.storage
          .from("documentos")
          .createSignedUrl(f.url_storage, 3600);
        return [f.url_storage, data?.signedUrl] as const;
      })
    ).then((resultados) => {
      if (cancelado) return;
      setUrls((prev) => {
        const siguiente = { ...prev };
        for (const [ruta, url] of resultados) {
          if (url) siguiente[ruta] = url;
        }
        return siguiente;
      });
    });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista]);

  async function subirArchivo(file: File) {
    const supabase = createClient();
    const ruta = `${tenantId}/inmueble/${inmuebleId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage.from("documentos").upload(ruta, file);
    if (uploadError) {
      setError(`No se pudo subir "${file.name}".`);
      return;
    }

    try {
      await registrarFoto(inmuebleId, file.name, ruta, file.size);
      setLista((prev) => [
        { id: ruta, nombre_archivo: file.name, url_storage: ruta, creado_en: new Date().toISOString() },
        ...prev,
      ]);
    } catch {
      setError(`No se pudo registrar "${file.name}".`);
    }
  }

  async function subirArchivos(files: FileList | File[]) {
    setSubiendo(true);
    setError(null);

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) await subirArchivo(file);
    }

    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function borrar(foto: Foto) {
    setLista((prev) => prev.filter((f) => f.id !== foto.id));
    await eliminarFoto(foto.id, inmuebleId, foto.url_storage);
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Fotos</h2>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (e.dataTransfer.files.length) subirArchivos(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          arrastrando ? "border-primary bg-primary/10" : "border-border hover:bg-muted/30"
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arrastra fotos aquí o haz clic para seleccionarlas
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={subiendo}
          onChange={(e) => {
            if (e.target.files?.length) subirArchivos(e.target.files);
          }}
          onClick={(e) => e.stopPropagation()}
          className="hidden"
        />
      </div>
      {subiendo && <p className="text-sm text-muted-foreground">Subiendo...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin fotos todavía.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {lista.map((f) => (
            <div key={f.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {urls[f.url_storage] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[f.url_storage]}
                  alt={f.nombre_archivo}
                  className="h-full w-full object-cover"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => borrar(f)}
                aria-label="Eliminar foto"
                className="absolute right-1 top-1 size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
