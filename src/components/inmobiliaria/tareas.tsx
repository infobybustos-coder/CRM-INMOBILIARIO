"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: string;
};

type TareaState = { error: string } | null;

const SUGERIDAS_PROPIETARIO = [
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

const SUGERIDAS_COMPRADOR = [
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

const SUGERIDAS_INMUEBLE = [
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
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const tituloRef = useRef<HTMLInputElement>(null);

  const lista =
    sugeridas === "comprador"
      ? SUGERIDAS_COMPRADOR
      : sugeridas === "inmueble"
        ? SUGERIDAS_INMUEBLE
        : SUGERIDAS_PROPIETARIO;

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">✅ Tareas</h2>

      <form action={formAction} onSubmit={() => setMostrarOpciones(false)} className="space-y-3">
        <div className="flex gap-2">
          <input
            ref={tituloRef}
            name="titulo"
            placeholder="Nueva tarea..."
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="button"
            onClick={() => setMostrarOpciones((v) => !v)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors",
              mostrarOpciones ? "bg-muted" : "text-muted-foreground hover:bg-accent"
            )}
          >
            {mostrarOpciones ? <X className="size-4" /> : <Plus className="size-4" />}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? "..." : "Añadir"}
          </button>
        </div>

        {mostrarOpciones && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fecha límite (opcional)</label>
              <input name="fecha_vencimiento" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Sugerencias rápidas</p>
              <div className="flex flex-wrap gap-1.5">
                {lista.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => tituloRef.current && (tituloRef.current.value = t)}
                    className="rounded-full border bg-background px-2.5 py-1 text-xs hover:bg-accent"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      </form>

      <div className="space-y-2 border-t pt-3">
        {tareas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas todavía.</p>
        ) : (
          tareas.map((t) => {
            const completada = t.estado === "completada";
            return (
              <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={completada}
                  onChange={(e) => alternarTareaAction(t.id, entidadId, e.target.checked)}
                  className="accent-primary"
                />
                <span className={cn(completada && "text-muted-foreground line-through")}>{t.titulo}</span>
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
