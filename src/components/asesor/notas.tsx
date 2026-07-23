"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type Actividad = {
  id: string;
  tipo: string;
  contenido: string | null;
  creado_en: string;
};

type NotaState = { error: string } | null;

const ETIQUETAS_TIPO_ACTIVIDAD: Record<string, string> = {
  nota: "Nota",
  llamada: "Llamada",
  email: "Email",
  whatsapp: "WhatsApp",
  visita: "Visita",
  tasacion: "Tasación",
  cambio_estado: "Cambio de estado",
  tarea_creada: "Tarea creada",
  tarea_completada: "Tarea completada",
  sistema: "Sistema",
};

export function Notas({
  actividades,
  crearNotaAction,
  titulo = "Notas",
}: {
  actividades: Actividad[];
  crearNotaAction: (prevState: NotaState, formData: FormData) => Promise<NotaState>;
  titulo?: string;
}) {
  const [state, formAction, pending] = useActionState(crearNotaAction, null);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">{titulo}</h2>

      <form action={formAction} className="space-y-2">
        <textarea
          name="contenido"
          rows={2}
          placeholder="Añadir una nota..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando..." : "Añadir nota"}
        </Button>
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
                  <span className="font-medium">{ETIQUETAS_TIPO_ACTIVIDAD[a.tipo] ?? a.tipo}</span>
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
