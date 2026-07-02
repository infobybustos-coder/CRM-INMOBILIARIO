"use client";

import { useActionState } from "react";
import {
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  FUENTES_LEAD,
  ETIQUETAS_FUENTE_LEAD,
  ETIQUETAS_ESTADO_PROPIETARIO,
} from "@/app/inmobiliaria/constantes";
import { actualizarPropietarioInmobiliaria } from "@/app/inmobiliaria/propietarios/actions";

type PropietarioFicha = {
  id: string;
  nombre: string;
  telefono: string | null;
  email?: string | null;
  whatsapp?: string | null;
  direccion: string | null;
  tipo_inmueble: string | null;
  estado: string;
  valor_estimado: number | null;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  fuente_lead: string | null;
  notas: string | null;
  agente_id?: string | null;
};

type Agente = { id: string; nombre_completo: string };

function aFechaInput(f: string | null | undefined) {
  return f ? f.slice(0, 10) : "";
}

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50";
const selectCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50";

export function FichaPropietario({
  propietario,
  agentes = [],
}: {
  propietario: PropietarioFicha;
  agentes?: Agente[];
}) {
  const accion = actualizarPropietarioInmobiliaria.bind(null, propietario.id);
  const [state, formAction, pending] = useActionState(accion, null);

  return (
    <form action={formAction} className="space-y-6">
      {/* Contacto */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          📞 Datos de contacto
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre *</label>
            <input name="nombre" defaultValue={propietario.nombre} required className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Teléfono</label>
            <input name="telefono" type="tel" defaultValue={propietario.telefono ?? ""} className={inputCls} placeholder="600 000 000" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input name="email" type="email" defaultValue={propietario.email ?? ""} className={inputCls} placeholder="correo@ejemplo.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">WhatsApp</label>
            <input name="whatsapp" type="tel" defaultValue={propietario.whatsapp ?? ""} className={inputCls} placeholder="600 000 000" />
          </div>
        </div>
      </div>

      {/* Inmueble */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          🏠 Datos del inmueble
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Dirección</label>
            <input name="direccion" defaultValue={propietario.direccion ?? ""} className={inputCls} placeholder="Calle, número, piso..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de inmueble</label>
            <select name="tipo_inmueble" defaultValue={propietario.tipo_inmueble ?? ""} className={selectCls}>
              <option value="">Sin especificar</option>
              {TIPOS_INMUEBLE.map((t) => (
                <option key={t} value={t}>{ETIQUETAS_TIPO_INMUEBLE[t]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Valor estimado (€)</label>
            <input name="valor_estimado" type="number" min="0" step="1000" defaultValue={propietario.valor_estimado ?? ""} className={inputCls} placeholder="250 000" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fuente del lead</label>
            <select name="fuente_lead" defaultValue={propietario.fuente_lead ?? ""} className={selectCls}>
              <option value="">Sin especificar</option>
              {FUENTES_LEAD.map((f) => (
                <option key={f} value={f}>{ETIQUETAS_FUENTE_LEAD[f]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Seguimiento */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          📅 Seguimiento
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Estado actual</p>
            <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {ETIQUETAS_ESTADO_PROPIETARIO[propietario.estado] ?? propietario.estado}
            </div>
            <p className="text-[11px] text-muted-foreground">Cambia desde el Kanban</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Último contacto</label>
            <input name="fecha_ultimo_contacto" type="date" defaultValue={aFechaInput(propietario.fecha_ultimo_contacto)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Próxima acción</label>
            <input name="fecha_proxima_accion" type="date" defaultValue={aFechaInput(propietario.fecha_proxima_accion)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Agente + notas */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          👤 Asesor y notas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {agentes.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Asesor asignado</label>
              <select name="agente_id" defaultValue={propietario.agente_id ?? ""} className={selectCls}>
                <option value="">Sin asignar</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre_completo}</option>
                ))}
              </select>
            </div>
          )}
          <div className={`space-y-1.5 ${agentes.length > 0 ? "" : "sm:col-span-2"}`}>
            <label className="text-sm font-medium">Notas internas</label>
            <textarea
              name="notas"
              rows={4}
              defaultValue={propietario.notas ?? ""}
              className={`${inputCls} resize-none`}
              placeholder="Observaciones, comentarios..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "💾 Guardar cambios"}
        </button>
        {state && "ok" in state && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            ✓ Guardado correctamente
          </span>
        )}
        {state && "error" in state && (
          <span className="text-sm font-medium text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  );
}
