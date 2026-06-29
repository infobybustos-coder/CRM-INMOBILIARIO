"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: string;
};

type TareaState = { error: string } | null;

const TAREAS_SUGERIDAS_PROPIETARIO = [
  "Llamar para concertar tasación",
  "Realizar visita de tasación",
  "Enviar valoración al propietario",
  "Solicitar nota simple",
  "Solicitar certificado energético",
  "Preparar reportaje fotográfico",
  "Enviar borrador de contrato de exclusiva",
  "Hacer seguimiento tras la visita",
  "Confirmar firma de exclusiva",
  "Publicar inmueble en portales",
];

const TAREAS_SUGERIDAS_COMPRADOR = [
  "Llamar para cualificar necesidades",
  "Enviar selección de inmuebles",
  "Programar visita a inmueble",
  "Hacer seguimiento tras la visita",
  "Preguntar por situación de financiación",
  "Preparar oferta de compra",
  "Hacer seguimiento de la oferta",
  "Confirmar firma de reserva",
  "Coordinar firma con notaría",
];

const TAREAS_SUGERIDAS_INMUEBLE = [
  "Hacer reportaje fotográfico",
  "Redactar anuncio para portales",
  "Publicar en portales",
  "Programar visitas",
  "Hacer seguimiento de visitas",
  "Revisar y ajustar el precio",
  "Solicitar certificado energético",
  "Preparar documentación para la venta",
  "Coordinar firma con notaría",
];

export function Tareas({
  entidadId,
  tareas,
  crearTareaAction,
  alternarTareaAction,
  sugeridas = "propietario",
}: {
  entidadId: string;
  tareas: Tarea[];
  crearTareaAction: (prevState: TareaState, formData: FormData) => Promise<TareaState>;
  alternarTareaAction: (tareaId: string, entidadId: string, completada: boolean) => Promise<void>;
  sugeridas?: "propietario" | "comprador" | "inmueble";
}) {
  const [state, formAction, pending] = useActionState(crearTareaAction, null);
  const tituloRef = useRef<HTMLInputElement>(null);
  const lista =
    sugeridas === "comprador"
      ? TAREAS_SUGERIDAS_COMPRADOR
      : sugeridas === "inmueble"
        ? TAREAS_SUGERIDAS_INMUEBLE
        : TAREAS_SUGERIDAS_PROPIETARIO;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">Tareas</h2>

      <form action={formAction} className="flex flex-wrap gap-2">
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value && tituloRef.current) {
              tituloRef.current.value = e.target.value;
              tituloRef.current.focus();
            }
            e.target.value = "";
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground"
        >
          <option value="">Tareas sugeridas...</option>
          {lista.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          ref={tituloRef}
          name="titulo"
          placeholder="Nueva tarea..."
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <input
          name="fecha_vencimiento"
          type="date"
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Añadiendo..." : "Añadir"}
        </Button>
      </form>
      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="space-y-2 border-t pt-3">
        {tareas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas todavía.</p>
        ) : (
          tareas.map((t) => {
            const completada = t.estado === "completada";
            return (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  defaultChecked={completada}
                  onChange={(e) => alternarTareaAction(t.id, entidadId, e.target.checked)}
                  className="accent-primary"
                />
                <span className={cn(completada && "text-muted-foreground line-through")}>
                  {t.titulo}
                </span>
                {t.fecha_vencimiento && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.fecha_vencimiento).toLocaleDateString("es-ES")}
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
