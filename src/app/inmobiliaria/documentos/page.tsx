import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FileText, Home, Users, UserSearch, Download } from "lucide-react";

const ETIQUETAS_TIPO: Record<string, string> = {
  foto: "Foto",
  contrato: "Contrato",
  escritura: "Escritura",
  nota_simple: "Nota simple",
  certificado: "Certificado",
  otro: "Documento",
};

const ICONOS_ENTIDAD: Record<string, React.ComponentType<{ className?: string }>> = {
  inmueble: Home,
  propietario: Users,
  comprador: UserSearch,
};

export default async function DocumentosPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, entidad_tipo, entidad_id, tipo_documento, nombre_archivo, url_storage, subido_por, creado_en")
    .eq("tenant_id", usuario.tenant_id)
    .order("creado_en", { ascending: false })
    .limit(100);

  const docs = documentos ?? [];

  // Build URL for each doc
  const conUrl = docs.map((d) => {
    const url = d.url_storage
      ? supabase.storage.from("documentos").getPublicUrl(d.url_storage).data.publicUrl
      : null;
    return { ...d, publicUrl: url };
  });

  // Group by entity type
  const porTipo = (tipo: string) => conUrl.filter(d => d.entidad_tipo === tipo);

  const grupos = [
    { tipo: "inmueble", label: "Inmuebles", icon: Home },
    { tipo: "propietario", label: "Propietarios", icon: Users },
    { tipo: "comprador", label: "Compradores", icon: UserSearch },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contratos, escrituras, notas simples y archivos del equipo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {grupos.map(({ tipo, label, icon: Icon }) => (
          <div key={tipo} className="rounded-xl border bg-card p-4 text-center">
            <Icon className="mx-auto mb-1 size-5 text-muted-foreground" />
            <p className="text-xl font-bold">{porTipo(tipo).length}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FileText className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">No hay documentos aún</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Los documentos que subas desde inmuebles, propietarios o compradores aparecerán aquí.
          </p>
        </div>
      ) : (
        grupos.map(({ tipo, label, icon: Icon }) => {
          const items = porTipo(tipo);
          if (items.length === 0) return null;
          return (
            <section key={tipo}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <Icon className="size-4" />
                {label}
                <span className="ml-1 rounded-full bg-muted px-2 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </h2>
              <div className="rounded-xl border divide-y overflow-hidden">
                {items.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="size-5 shrink-0 text-muted-foreground/60" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">
                        {doc.nombre_archivo ?? doc.url_storage ?? "Documento"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ETIQUETAS_TIPO[doc.tipo_documento] ?? doc.tipo_documento} ·{" "}
                        {new Date(doc.creado_en).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {doc.publicUrl && (
                      <a
                        href={doc.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                      >
                        <Download className="size-3" />
                        Ver
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
