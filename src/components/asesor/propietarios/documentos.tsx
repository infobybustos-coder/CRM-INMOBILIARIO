"use client";

import { useRef, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  registrarDocumento,
  eliminarDocumento,
} from "@/app/asesor/propietarios/actions";
import {
  TIPOS_DOCUMENTO,
  ETIQUETAS_TIPO_DOCUMENTO,
} from "@/app/asesor/propietarios/constantes";
import { Button } from "@/components/ui/button";

type Documento = {
  id: string;
  tipo_documento: string | null;
  nombre_archivo: string;
  url_storage: string;
  creado_en: string;
};

export function Documentos({
  propietarioId,
  tenantId,
  documentos,
}: {
  propietarioId: string;
  tenantId: string;
  documentos: Documento[];
}) {
  const [lista, setLista] = useState(documentos);
  const [tipo, setTipo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function subirArchivo(file: File) {
    setSubiendo(true);
    setError(null);

    const supabase = createClient();
    const ruta = `${tenantId}/propietario/${propietarioId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(ruta, file);

    if (uploadError) {
      setError("No se pudo subir el archivo.");
      setSubiendo(false);
      return;
    }

    try {
      await registrarDocumento(propietarioId, file.name, ruta, tipo || null);
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
      setError("No se pudo registrar el documento.");
    }

    setSubiendo(false);
    setTipo("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function borrar(documento: Documento) {
    setLista((prev) => prev.filter((d) => d.id !== documento.id));
    await eliminarDocumento(documento.id, propietarioId, documento.url_storage);
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

      <div className="flex flex-wrap gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Tipo de documento</option>
          {TIPOS_DOCUMENTO.map((t) => (
            <option key={t} value={t}>
              {ETIQUETAS_TIPO_DOCUMENTO[t]}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          disabled={subiendo}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) subirArchivo(file);
          }}
          className="text-sm"
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
