"use client";

import { useRef, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarDocumentoEntidad, eliminarDocumentoEntidad } from "@/app/inmobiliaria/actions";
import { cn } from "@/lib/utils";

type Documento = {
  id: string;
  tipo_documento: string | null;
  nombre_archivo: string;
  url_storage: string;
  creado_en: string;
};

const TIPOS = [
  { value: "contrato", label: "Contrato" },
  { value: "nota_simple", label: "Nota simple" },
  { value: "foto", label: "Foto" },
  { value: "plano", label: "Plano" },
  { value: "certificado_energetico", label: "Certificado energético" },
  { value: "escritura", label: "Escritura" },
  { value: "factura", label: "Factura" },
  { value: "otro", label: "Otro" },
];

export function SubidaDocumentos({
  entidadTipo,
  entidadId,
  tenantId,
  documentos: inicial,
}: {
  entidadTipo: "propietario" | "inmueble" | "comprador";
  entidadId: string;
  tenantId: string;
  documentos: Documento[];
}) {
  const [lista, setLista] = useState(inicial);
  const [tipo, setTipo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function subirArchivo(file: File) {
    const supabase = createClient();
    const ruta = `${tenantId}/${entidadTipo}/${entidadId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage.from("documentos").upload(ruta, file);
    if (uploadError) { setError(`No se pudo subir "${file.name}".`); return; }

    try {
      await registrarDocumentoEntidad(entidadTipo, entidadId, file.name, ruta, tipo || null);
      setLista((prev) => [
        { id: ruta, tipo_documento: tipo || null, nombre_archivo: file.name, url_storage: ruta, creado_en: new Date().toISOString() },
        ...prev,
      ]);
    } catch {
      setError(`No se pudo registrar "${file.name}".`);
    }
  }

  async function subirArchivos(files: FileList | File[]) {
    setSubiendo(true); setError(null);
    for (const f of Array.from(files)) await subirArchivo(f);
    setSubiendo(false); setTipo("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function borrar(doc: Documento) {
    setLista((prev) => prev.filter((d) => d.id !== doc.id));
    await eliminarDocumentoEntidad(doc.id, entidadTipo, entidadId, doc.url_storage);
  }

  async function abrir(urlStorage: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from("documentos").createSignedUrl(urlStorage, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        📎 Documentos
      </h2>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tipo de documento (opcional)</option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault(); setArrastrando(false);
          if (e.dataTransfer.files.length) subirArchivos(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          arrastrando ? "border-primary bg-primary/10" : "border-border hover:bg-muted/30"
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {subiendo ? "Subiendo..." : "Arrastra archivos aquí o haz clic para seleccionarlos"}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={subiendo}
          onChange={(e) => { if (e.target.files?.length) subirArchivos(e.target.files); }}
          onClick={(e) => e.stopPropagation()}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {lista.length > 0 && (
        <div className="divide-y rounded-lg border">
          {lista.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <button type="button" onClick={() => abrir(d.url_storage)} className="flex items-center gap-2 text-sm hover:underline text-left">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span>{d.nombre_archivo}</span>
                {d.tipo_documento && (
                  <span className="text-xs text-muted-foreground">
                    ({TIPOS.find((t) => t.value === d.tipo_documento)?.label ?? d.tipo_documento})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => borrar(d)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {lista.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin documentos todavía.</p>
      )}
    </div>
  );
}
