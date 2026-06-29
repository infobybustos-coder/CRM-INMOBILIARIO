"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

const OPCIONES = [
  { value: "llamar", label: "Llamar" },
  { value: "enviar_documentacion", label: "Enviar documentación" },
  { value: "programar_visita", label: "Programar visita" },
  { value: "esperar_respuesta", label: "Esperar respuesta" },
];

export function SiguientePaso({
  propietarioId,
  nombrePropietario,
  crearSiguientePasoAction,
}: {
  propietarioId: string;
  nombrePropietario: string;
  crearSiguientePasoAction: (
    propietarioId: string,
    nombrePropietario: string,
    paso: string
  ) => Promise<void>;
}) {
  const [paso, setPaso] = useState("llamar");
  const [hecho, setHecho] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      await crearSiguientePasoAction(propietarioId, nombrePropietario, paso);
      setHecho(true);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
      <span className="text-sm font-medium">Siguiente paso:</span>
      <select
        value={paso}
        onChange={(e) => {
          setPaso(e.target.value);
          setHecho(false);
        }}
        className="rounded-md border bg-background px-3 py-2 text-sm"
      >
        {OPCIONES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" onClick={confirmar} disabled={pending}>
        {pending ? "Creando..." : "Confirmar"}
      </Button>
      {hecho && !pending && (
        <span className="text-sm text-green-500">Tarea y recordatorio creados.</span>
      )}
    </div>
  );
}
