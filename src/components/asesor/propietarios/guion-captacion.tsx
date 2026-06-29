"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RespuestasCaptacion } from "@/app/asesor/propietarios/constantes";

type GuionState = { error: string } | { ok: true } | null;

const PREGUNTAS: { campo: keyof RespuestasCaptacion; texto: string }[] = [
  { campo: "motivo_venta", texto: "¿Por qué quiere vender?" },
  { campo: "plazo", texto: "¿En cuánto tiempo?" },
  { campo: "otras_agencias", texto: "¿Ha hablado con otras agencias?" },
  { campo: "precio_esperado", texto: "¿Qué precio espera?" },
  { campo: "acepta_exclusiva", texto: "¿Aceptaría una exclusiva?" },
];

export function GuionCaptacion({
  respuestas,
  actualizarGuionAction,
}: {
  respuestas: RespuestasCaptacion | null;
  actualizarGuionAction: (
    prevState: GuionState,
    formData: FormData
  ) => Promise<GuionState>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarGuionAction, null);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left font-semibold"
      >
        Modo Captación
        <span className="text-sm text-muted-foreground">{abierto ? "Ocultar" : "Mostrar"}</span>
      </button>

      {abierto && (
        <form action={formAction} className="space-y-4 border-t p-4">
          {PREGUNTAS.map(({ campo, texto }) => (
            <div key={campo} className="space-y-2">
              <label htmlFor={campo} className="text-sm font-medium">
                {texto}
              </label>
              <input
                id={campo}
                name={campo}
                defaultValue={respuestas?.[campo] ?? ""}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          ))}

          {state && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state && "ok" in state && <p className="text-sm text-green-500">Guardado.</p>}

          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Guardando..." : "Guardar respuestas"}
          </Button>
        </form>
      )}
    </div>
  );
}
