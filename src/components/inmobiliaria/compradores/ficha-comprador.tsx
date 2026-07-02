"use client";

import { useActionState } from "react";
import {
  ESTADOS_COMPRADOR,
  ETIQUETAS_ESTADO_COMPRADOR,
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  TIPOS_FINANCIACION,
  ETIQUETAS_FINANCIACION,
  NIVELES_URGENCIA,
  ETIQUETAS_URGENCIA,
  type Comprador,
  type Zona,
} from "@/app/asesor/compradores/constantes";
import { actualizarComprador } from "@/app/asesor/compradores/actions";

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

export function FichaComprador({
  comprador,
  zonas,
  agentes = [],
}: {
  comprador: Comprador & { agente_id?: string };
  zonas: Zona[];
  agentes?: Agente[];
}) {
  const accion = actualizarComprador.bind(null, comprador.id);
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
            <input name="nombre" defaultValue={comprador.nombre} required className={inputCls} />
          </Campo>
          <Campo label="Teléfono" highlight={falta(comprador.telefono)}>
            <input name="telefono" type="tel" defaultValue={comprador.telefono ?? ""} className={inputCls} placeholder="600 000 000" />
          </Campo>
          <Campo label="Email">
            <input name="email" type="email" defaultValue={comprador.email ?? ""} className={inputCls} placeholder="correo@ejemplo.com" />
          </Campo>
          <Campo label="Urgencia" highlight={falta(comprador.urgencia)}>
            <select name="urgencia" defaultValue={comprador.urgencia ?? ""} className={selectCls}>
              <option value="">Sin especificar</option>
              {NIVELES_URGENCIA.map((u) => (
                <option key={u} value={u}>{ETIQUETAS_URGENCIA[u]}</option>
              ))}
            </select>
          </Campo>
        </div>
      </div>

      {/* Qué busca */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>🔍 Qué está buscando</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Tipo de inmueble" highlight={falta(comprador.tipo_inmueble)}>
            <select name="tipo_inmueble" defaultValue={comprador.tipo_inmueble ?? ""} className={selectCls}>
              <option value="">Cualquier tipo</option>
              {TIPOS_INMUEBLE.map((t) => (
                <option key={t} value={t}>{ETIQUETAS_TIPO_INMUEBLE[t]}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Zona buscada" highlight={falta(comprador.zona_buscada_id)}>
            <select name="zona_buscada_id" defaultValue={comprador.zona_buscada_id ?? ""} className={selectCls}>
              <option value="">Cualquier zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}{z.ciudad ? ` (${z.ciudad})` : ""}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Presupuesto mínimo (€)">
            <input name="presupuesto_min" type="number" min="0" step="1000" defaultValue={comprador.presupuesto_min ?? ""} className={inputCls} placeholder="150 000" />
          </Campo>
          <Campo label="Presupuesto máximo (€)" highlight={falta(comprador.presupuesto_max)}>
            <input name="presupuesto_max" type="number" min="0" step="1000" defaultValue={comprador.presupuesto_max ?? ""} className={inputCls} placeholder="300 000" />
          </Campo>
          <Campo label="Financiación" highlight={falta(comprador.financiacion)}>
            <select name="financiacion" defaultValue={comprador.financiacion ?? ""} className={selectCls}>
              <option value="">Sin especificar</option>
              {TIPOS_FINANCIACION.map((f) => (
                <option key={f} value={f}>{ETIQUETAS_FINANCIACION[f]}</option>
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
              {ETIQUETAS_ESTADO_COMPRADOR[comprador.estado] ?? comprador.estado}
            </div>
            <p className="text-[11px] text-muted-foreground">Cambia el estado desde la vista Kanban</p>
          </div>
          <Campo label="Último contacto">
            <input name="fecha_ultimo_contacto" type="date" defaultValue={aFechaInput(comprador.fecha_ultimo_contacto)} className={inputCls} />
          </Campo>
          <Campo label="Próxima acción">
            <input name="fecha_proxima_accion" type="date" defaultValue={aFechaInput(comprador.fecha_proxima_accion)} className={inputCls} />
          </Campo>
        </div>
      </div>

      {/* Agente + notas */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>👤 Agente y notas</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          {agentes.length > 0 && (
            <Campo label="Agente asignado">
              <select name="agente_id" defaultValue={comprador.agente_id ?? ""} className={selectCls}>
                <option value="">Sin asignar</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre_completo}</option>
                ))}
              </select>
            </Campo>
          )}
          <div className={`space-y-1.5 ${agentes.length > 0 ? "" : "sm:col-span-2"}`}>
            <label className="text-sm font-medium">Notas</label>
            <textarea name="notas" rows={4} defaultValue={comprador.notas ?? ""} className={`${inputCls} resize-none`} placeholder="Requisitos especiales, comentarios..." />
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
