"use client";

import { useActionState, useRef, useEffect } from "react";
import { enviarMensaje } from "./actions";
import { Send } from "lucide-react";

export function FormularioMensaje({
  contactos,
  receptorId,
}: {
  contactos: { id: string; nombre_completo: string }[];
  receptorId?: string;
}) {
  const [state, formAction, pending] = useActionState(enviarMensaje, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {state && "error" in state && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state && "ok" in state && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Mensaje enviado.
        </p>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Para</label>
        <select
          name="receptor_id"
          defaultValue={receptorId ?? ""}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Seleccionar destinatario...</option>
          {contactos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre_completo}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Mensaje</label>
        <textarea
          name="contenido"
          rows={3}
          required
          placeholder="Escribe tu mensaje..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        <Send className="size-4" />
        {pending ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
