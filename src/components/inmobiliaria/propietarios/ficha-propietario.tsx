"use client";

import { useActionState } from "react";
import {
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  FUENTES_LEAD,
  ETIQUETAS_FUENTE_LEAD,
  ETIQUETAS_ESTADO,
  type Propietario,
} from "@/app/asesor/propietarios/constantes";
import { actualizarPropietario } from "@/app/asesor/propietarios/actions";

function aFechaInput(f: string | null) {
  return f ? f.slice(0, 10) : "";
}

function SeccionTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function Campo({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className={`text-sm font-medium flex items-center gap-1.5 ${highlight ? "text-amber-600 dark:text-amber-400" : ""}`}>
        {label}
        {highlight && <span className="size-1.5 rounded-full bg-red-500 inline-block" />}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50";
const selectCls = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50";

type Agente = { id: string; nombre_completo: string };

export function FichaPropietario({
  propietario,
  agentes = [],
}: {
  propietario: Propietario & { agente_id?: string };
  agentes?: Agente[];
}) {
  const accion = actualizarPropietario.bind(null, propietario.id);
  const [state, formAction, pending] = useActionState(accion, null);

  const falta = (v: unknown) => !v;

  return (
    <form action={formAction} className="space-y-6">
      {state && "error" in state && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state && "ok" in state && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Cambios guardados correctamente.</p>
      )}

      {/* Contacto */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>📞 Datos de contacto</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nombre">
            <input name="nombre" defaultValue={propietario.nombre} required className={inputCls} />
          </Campo>
          <Campo label="Teléfono" highlight={falta(propietario.telefono)}>
            <input name="telefono" type="tel" defaultValue={propietario.telefono ?? ""} className={inputCls} placeholder="600 000 000" />
          </Campo>
          <Campo label="Email">
            <input name="email" type="email" defaultValue={propietario.email ?? ""} className={inputCls} placeholder="correo@ejemplo.com" />
          </Campo>
          <Campo label="WhatsApp">
            <input name="whatsapp" type="tel" defaultValue={propietario.whatsapp ?? ""} className={inputCls} placeholder="600 000 000" />
          </Campo>
        </div>
      </div>

      {/* Inmueble */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>🏠 Datos del inmueble</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Dirección" highlight={falta(propietario.direccion)}>
            <input name="direccion" defaultValue={propietario.direccion ?? ""} className={`${inputCls} sm:col-span-2`} placeholder="Calle, número, piso..." />
          </Campo>
          <Campo label="Tipo de inmueble" highlight={falta(propietario.tipo_inmueble)}>
            <select name="tipo_inmueble" defaultValue={propietario.tipo_inmueble ?? ""} className={selectCls}>
              <option value="">Sin especificar</option>
              {TIPOS_INMUEBLE.map((t) => (
                <option key={t} value={t}>{ETIQUETAS_TIPO_INMUEBLE[t]}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Valor estimado (€)" highlight={falta(propietario.valor_estimado)}>
            <input name="valor_estimado" type="number" min="0" step="1000" defaultValue={propietario.valor_estimado ?? ""} className={inputCls} placeholder="250 000" />
          </Campo>
          <Campo label="Fuente del lead" highlight={falta(propietario.fuente_lead)}>
            <select name="fuente_lead" defaultValue={propietario.fuente_lead ?? ""} className={selectCls}>
              <option value="">Sin especificar</option>
              {FUENTES_LEAD.map((f) => (
                <option key={f} value={f}>{ETIQUETAS_FUENTE_LEAD[f]}</option>
              ))}
            </select>
          </Campo>
        </div>
      </div>

      {/* Seguimiento */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>📅 Seguimiento</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Estado actual</p>
            <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {ETIQUETAS_ESTADO[propietario.estado] ?? propietario.estado}
            </div>
            <p className="text-[11px] text-muted-foreground">Cambia el estado desde la vista Kanban</p>
          </div>
          <Campo label="Último contacto">
            <input name="fecha_ultimo_contacto" type="date" defaultValue={aFechaInput(propietario.fecha_ultimo_contacto)} className={inputCls} />
          </Campo>
          <Campo label="Próxima acción">
            <input name="fecha_proxima_accion" type="date" defaultValue={aFechaInput(propietario.fecha_proxima_accion)} className={inputCls} />
          </Campo>
        </div>
      </div>

      {/* Agente + notas */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>👤 Agente y notas</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          {agentes.length > 0 && (
            <Campo label="Agente asignado">
              <select name="agente_id" defaultValue={propietario.agente_id ?? ""} className={selectCls}>
                <option value="">Sin asignar</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre_completo}</option>
                ))}
              </select>
            </Campo>
          )}
          <div className={`space-y-1.5 ${agentes.length > 0 ? "" : "sm:col-span-2"}`}>
            <label className="text-sm font-medium">Notas</label>
            <textarea name="notas" rows={4} defaultValue={propietario.notas ?? ""} className={`${inputCls} resize-none`} placeholder="Observaciones, comentarios..." />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
