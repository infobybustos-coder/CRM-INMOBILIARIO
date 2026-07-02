"use client";

import { useActionState } from "react";
import {
  ESTADOS_INMUEBLE,
  ETIQUETAS_ESTADO_INMUEBLE,
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
} from "@/app/inmobiliaria/constantes";
import { actualizarInmuebleInmobiliaria } from "@/app/inmobiliaria/inmuebles/actions";

type InmuebleFicha = {
  id: string;
  referencia: string | null;
  direccion: string;
  zona_id: string | null;
  propietario_id: string | null;
  precio: number | null;
  metros_cuadrados: number | null;
  habitaciones: number | null;
  banos: number | null;
  tipo: string | null;
  estado: string;
  certificado_energetico: string | null;
  descripcion: string | null;
  fecha_publicacion: string | null;
  agente_id?: string | null;
};

type Zona = { id: string; nombre: string; ciudad?: string | null };
type PropietarioMini = { id: string; nombre: string };

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

export function FichaInmueble({
  inmueble,
  zonas,
  propietarios,
}: {
  inmueble: InmuebleFicha;
  zonas: Zona[];
  propietarios: PropietarioMini[];
}) {
  const accion = actualizarInmuebleInmobiliaria.bind(null, inmueble.id);
  const [state, formAction, pending] = useActionState(accion, null);

  const falta = (v: unknown) => !v;

  return (
    <form action={formAction} className="space-y-6">
      {/* Identificación */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>📋 Identificación</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Dirección">
            <input name="direccion" defaultValue={inmueble.direccion} required className={`${inputCls} sm:col-span-2`} />
          </Campo>
          <Campo label="Referencia interna">
            <input name="referencia" defaultValue={inmueble.referencia ?? ""} className={inputCls} placeholder="REF-001" />
          </Campo>
          <Campo label="Propietario" highlight={falta(inmueble.propietario_id)}>
            <select name="propietario_id" defaultValue={inmueble.propietario_id ?? ""} className={selectCls}>
              <option value="">Sin asignar</option>
              {propietarios.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Estado">
            <select name="estado" defaultValue={inmueble.estado} className={selectCls}>
              {ESTADOS_INMUEBLE.map((e) => (
                <option key={e} value={e}>{ETIQUETAS_ESTADO_INMUEBLE[e]}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Zona" highlight={falta(inmueble.zona_id)}>
            <select name="zona_id" defaultValue={inmueble.zona_id ?? ""} className={selectCls}>
              <option value="">Sin zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}{z.ciudad ? ` (${z.ciudad})` : ""}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </div>

      {/* Características */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>🏗️ Características</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Tipo" highlight={falta(inmueble.tipo)}>
            <select name="tipo" defaultValue={inmueble.tipo ?? ""} className={selectCls}>
              <option value="">Sin especificar</option>
              {TIPOS_INMUEBLE.map((t) => (
                <option key={t} value={t}>{ETIQUETAS_TIPO_INMUEBLE[t]}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Precio (€)" highlight={falta(inmueble.precio)}>
            <input name="precio" type="number" min="0" step="1000" defaultValue={inmueble.precio ?? ""} className={inputCls} placeholder="250 000" />
          </Campo>
          <Campo label="m²" highlight={falta(inmueble.metros_cuadrados)}>
            <input name="metros_cuadrados" type="number" min="0" defaultValue={inmueble.metros_cuadrados ?? ""} className={inputCls} placeholder="90" />
          </Campo>
          <Campo label="Habitaciones">
            <input name="habitaciones" type="number" min="0" max="20" defaultValue={inmueble.habitaciones ?? ""} className={inputCls} placeholder="3" />
          </Campo>
          <Campo label="Baños">
            <input name="banos" type="number" min="0" max="10" defaultValue={inmueble.banos ?? ""} className={inputCls} placeholder="2" />
          </Campo>
          <Campo label="Certificado energético">
            <select name="certificado_energetico" defaultValue={inmueble.certificado_energetico ?? ""} className={selectCls}>
              <option value="">Sin certificado</option>
              {["A", "B", "C", "D", "E", "F", "G"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Campo>
        </div>
      </div>

      {/* Publicación y descripción */}
      <div className="rounded-xl border bg-card p-5">
        <SeccionTitulo>📢 Publicación</SeccionTitulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Fecha de publicación">
            <input name="fecha_publicacion" type="date" defaultValue={aFechaInput(inmueble.fecha_publicacion)} className={inputCls} />
          </Campo>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={`text-sm font-medium flex items-center gap-1.5 ${falta(inmueble.descripcion) ? "text-amber-600 dark:text-amber-400" : ""}`}>
              Descripción
              {falta(inmueble.descripcion) && <span className="size-1.5 rounded-full bg-red-500 inline-block" />}
            </label>
            <textarea name="descripcion" rows={5} defaultValue={inmueble.descripcion ?? ""} className={`${inputCls} resize-none`} placeholder="Descripción detallada del inmueble para publicar en portales..." />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? "Guardando..." : "💾 Guardar cambios"}
        </button>
        {state && "ok" in state && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✓ Guardado correctamente</span>
        )}
        {state && "error" in state && (
          <span className="text-sm font-medium text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  );
}
