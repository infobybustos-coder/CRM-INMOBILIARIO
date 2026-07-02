"use client";

import { useActionState } from "react";

type Actividad = {
  id: string;
  tipo: string;
  contenido: string | null;
  creado_en: string;
};

type NotaState = { error: string } | null;

const ETIQUETAS_TIPO: Record<string, string> = {
  nota: "Nota",
  llamada: "Llamada",
  email: "Email",
  whatsapp: "WhatsApp",
  visita: "Visita",
  tasacion: "Tasación",
  cambio_estado: "Cambio de estado",
  sistema: "Sistema",
};

export function Notas({
  actividades,
  crearNotaAction,
}: {
  actividades: Actividad[];
  crearNotaAction: (prevState: NotaState, formData: FormData) => Promise<NotaState>;
}) {
  const [state, formAction, pending] = useActionState(crearNotaAction, null);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">📝 Historial de actividad</h2>

      <form action={formAction} className="space-y-2">
        <textarea
          name="contenido"
          rows={2}
          placeholder="Añadir una nota..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
        {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Añadir nota"}
        </button>
      </form>

      <div className="space-y-0 border-t pt-3">
        {actividades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad todavía.</p>
        ) : (
          actividades.map((a, i) => (
            <div key={a.id} className="relative flex gap-3 pb-4 text-sm last:pb-0">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                {i < actividades.length - 1 && (
                  <span className="w-px flex-1 bg-border" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-medium">{ETIQUETAS_TIPO[a.tipo] ?? a.tipo}</span>
                  <span className="text-xs">{new Date(a.creado_en).toLocaleString("es-ES")}</span>
                </div>
                {a.contenido && <p className="mt-0.5">{a.contenido}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
