"use client";

import { useActionState } from "react";
import { crearNota } from "@/app/asesor/propietarios/actions";
import { Button } from "@/components/ui/button";

type Actividad = {
  id: string;
  tipo: string;
  contenido: string | null;
  creado_en: string;
};

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
  propietarioId,
  actividades,
}: {
  propietarioId: string;
  actividades: Actividad[];
}) {
  const accion = crearNota.bind(null, propietarioId);
  const [state, formAction, pending] = useActionState(accion, null);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Notas</h2>

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

      <div className="space-y-3 border-t pt-3">
        {actividades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad todavía.</p>
        ) : (
          actividades.map((a) => (
            <div key={a.id} className="text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{ETIQUETAS_TIPO_ACTIVIDAD[a.tipo] ?? a.tipo}</span>
                <span>{new Date(a.creado_en).toLocaleString("es-ES")}</span>
              </div>
              {a.contenido && <p>{a.contenido}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
