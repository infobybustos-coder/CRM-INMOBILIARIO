"use client";

import { useActionState, useEffect, useRef } from "react";
import { Headset, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { enviarMensajeSoporte, type SoporteState } from "@/app/asesor/soporte/actions";

type Mensaje = {
  id: string;
  remitente: "asesor" | "soporte";
  contenido: string;
  creado_en: string;
};

export function SoporteChat({ mensajes }: { mensajes: Mensaje[] }) {
  const [state, formAction, pending] = useActionState<SoporteState, FormData>(
    enviarMensajeSoporte,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length]);

  useEffect(() => {
    if (!pending && !(state && "error" in state)) formRef.current?.reset();
  }, [pending, state]);

  return (
    <div className="flex h-[70vh] max-h-[640px] flex-col rounded-lg border">
      <div className="flex items-center gap-2 border-b p-3">
        <Headset className="size-4 text-primary" />
        <div>
          <p className="text-sm font-medium">Soporte técnico</p>
          <p className="text-xs text-muted-foreground">
            Cuéntanos cualquier problema con el software, te responderemos aquí.
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {mensajes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no has escrito a soporte. ¡Cuéntanos en qué podemos ayudarte!
          </p>
        ) : (
          mensajes.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.remitente === "asesor" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  m.remitente === "asesor"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p>{m.contenido}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    m.remitente === "asesor" ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {new Date(m.creado_en).toLocaleString("es-ES", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={finRef} />
      </div>

      <form ref={formRef} action={formAction} className="flex items-center gap-2 border-t p-2">
        <input
          name="contenido"
          required
          placeholder="Escribe tu mensaje..."
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Enviar mensaje"
          className="flex shrink-0 items-center justify-center rounded-md bg-primary p-2.5 text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </form>
      {state && "error" in state && (
        <p className="px-3 pb-2 text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}
