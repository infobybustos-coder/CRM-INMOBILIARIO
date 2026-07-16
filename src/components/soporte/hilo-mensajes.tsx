import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mensaje } from "@/lib/soporte/tipos";

function fechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export function HiloMensajes({ mensajes, autorPropio }: { mensajes: Mensaje[]; autorPropio: "cliente" | "soporte" }) {
  if (mensajes.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Todavía no hay mensajes en esta conversación.</p>;
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {mensajes.map((m) => {
        const esPropio = m.autorTipo === autorPropio;
        return (
          <div key={m.id} className={cn("flex", esPropio ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] space-y-2 rounded-lg px-3 py-2 text-sm",
                esPropio ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}
            >
              {m.contenido && <p className="whitespace-pre-wrap">{m.contenido}</p>}
              {m.adjuntos.length > 0 && (
                <div className="space-y-1">
                  {m.adjuntos.map((a) => (
                    <a
                      key={a.id}
                      href={a.urlFirmada ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs underline underline-offset-2",
                        esPropio ? "border-primary-foreground/30" : "border-border"
                      )}
                    >
                      <Paperclip className="size-3 shrink-0" />
                      <span className="truncate">{a.nombreArchivo}</span>
                    </a>
                  ))}
                </div>
              )}
              <p
                className={cn(
                  "text-[10px]",
                  esPropio ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {fechaHora(m.creadoEn)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
