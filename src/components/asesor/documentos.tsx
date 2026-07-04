"use client";

import { useRef, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  TIPOS_DOCUMENTO,
  ETIQUETAS_TIPO_DOCUMENTO,
} from "@/app/asesor/propietarios/constantes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Documento = {
  id: string;
  tipo_documento: string | null;
  nombre_archivo: string;
  url_storage: string;
  creado_en: string;
};

export function Documentos({
  entidadId,
  tenantId,
  documentos,
  carpeta,
  registrarDocumentoAction,
  eliminarDocumentoAction,
}: {
  entidadId: string;
  tenantId: string;
  documentos: Documento[];
  carpeta: string;
  registrarDocumentoAction: (
    entidadId: string,
    nombreArchivo: string,
    urlStorage: string,
    tipoDocumento: string | null
  ) => Promise<void>;
  eliminarDocumentoAction: (documentoId: string, entidadId: string, urlStorage: string) => Promise<void>;
}) {
  const [lista, setLista] = useState(documentos);
  const [tipo, setTipo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function subirArchivo(file: File) {
    const supabase = createClient();
    const ruta = `${tenantId}/${carpeta}/${entidadId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(ruta, file);

    if (uploadError) {
      setError(`No se pudo subir "${file.name}".`);
      return;
    }

    try {
      await registrarDocumentoAction(entidadId, file.name, ruta, tipo || null);
      setLista((prev) => [
        {
          id: ruta,
          tipo_documento: tipo || null,
          nombre_archivo: file.name,
          url_storage: ruta,
          creado_en: new Date().toISOString(),
        },
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
      await subirArchivo(file);
    }

    setSubiendo(false);
    setTipo("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function borrar(documento: Documento) {
    setLista((prev) => prev.filter((d) => d.id !== documento.id));
    await eliminarDocumentoAction(documento.id, entidadId, documento.url_storage);
  }

  async function abrir(urlStorage: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documentos")
      .createSignedUrl(urlStorage, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Documentos</h2>

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">Tipo de documento (opcional)</option>
        {TIPOS_DOCUMENTO.map((t) => (
          <option key={t} value={t}>
            {ETIQUETAS_TIPO_DOCUMENTO[t]}
          </option>
        ))}
      </select>

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
          Arrastra archivos aquí o haz clic para seleccionarlos
        </p>
        <input
          ref={inputRef}
          type="file"
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

      <div className="space-y-2 border-t pt-3">
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin documentos todavía.</p>
        ) : (
          lista.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => abrir(d.url_storage)}
                className="flex items-center gap-2 underline"
              >
                <FileText className="size-4" />
                {d.nombre_archivo}
                {d.tipo_documento && (
                  <span className="text-xs text-muted-foreground">
                    ({ETIQUETAS_TIPO_DOCUMENTO[d.tipo_documento] ?? d.tipo_documento})
                  </span>
                )}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => borrar(d)}
                aria-label="Eliminar documento"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
