"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  TIPOS_INMUEBLE,
  ETIQUETAS_TIPO_INMUEBLE,
  FUENTES_LEAD,
  ETIQUETAS_FUENTE_LEAD,
  ETIQUETAS_ESTADO_PROPIETARIO,
} from "@/app/inmobiliaria/constantes";
import {
  cargarPropietarioPanel,
  actualizarPropietarioInmobiliaria,
} from "@/app/inmobiliaria/propietarios/actions";
import { SubidaDocumentos } from "@/components/inmobiliaria/subida-documentos";
import { calcularPrioridad } from "@/lib/prioridad";
import { cn } from "@/lib/utils";

type Agente = { id: string; nombre_completo: string };

type Documento = {
  id: string;
  tipo_documento: string | null;
  nombre_archivo: string;
  url_storage: string;
  creado_en: string;
};

type PropietarioPanel = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  whatsapp: string | null;
  direccion: string | null;
  tipo_inmueble: string | null;
  estado: string;
  valor_estimado: number | null;
  fecha_ultimo_contacto: string | null;
  fecha_proxima_accion: string | null;
  fuente_lead: string | null;
  notas: string | null;
  agente_id: string | null;
};

const PRIORIDAD_COLOR: Record<string, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  baja: "bg-muted text-muted-foreground",
};

const inputCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50";
const selectCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50";

function aFechaInput(f: string | null | undefined) {
  return f ? f.slice(0, 10) : "";
}

function FormularioPanel({
  propietario,
  agentes,
  documentos,
  tenantId,
  onGuardado,
}: {
  propietario: PropietarioPanel;
  agentes: Agente[];
  documentos: Documento[];
  tenantId: string;
  onGuardado: () => void;
}) {
  const accion = actualizarPropietarioInmobiliaria.bind(null, propietario.id);
  const [state, formAction, pending] = useActionState(accion, null);
  const prioridad = calcularPrioridad(propietario);

  useEffect(() => {
    if (state && "ok" in state) onGuardado();
  }, [state, onGuardado]);

  return (
    <form action={formAction} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-5 px-5 py-4">

        {/* Información básica */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            👤 Información
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Nombre *</label>
              <input name="nombre" defaultValue={propietario.nombre} required className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
              <input name="telefono" type="tel" defaultValue={propietario.telefono ?? ""} className={inputCls} placeholder="600 000 000" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
              <input name="whatsapp" type="tel" defaultValue={propietario.whatsapp ?? ""} className={inputCls} placeholder="600 000 000" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input name="email" type="email" defaultValue={propietario.email ?? ""} className={inputCls} placeholder="correo@ejemplo.com" />
            </div>
          </div>
        </section>

        {/* Estado y gestión */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            📊 Estado y gestión
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                {ETIQUETAS_ESTADO_PROPIETARIO[propietario.estado] ?? propietario.estado}
              </div>
              <p className="text-[10px] text-muted-foreground">Cambia desde el Kanban</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Prioridad</label>
              <div className={cn(
                "w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize",
                prioridad ? PRIORIDAD_COLOR[prioridad] : "bg-muted text-muted-foreground"
              )}>
                {prioridad ?? "Sin calcular"}
              </div>
            </div>
            {agentes.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Asesor asignado</label>
                <select name="agente_id" defaultValue={propietario.agente_id ?? ""} className={selectCls}>
                  <option value="">Sin asignar</option>
                  {agentes.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre_completo}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Inmueble */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            🏠 Inmueble
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Dirección</label>
              <input name="direccion" defaultValue={propietario.direccion ?? ""} className={inputCls} placeholder="Calle, número..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select name="tipo_inmueble" defaultValue={propietario.tipo_inmueble ?? ""} className={selectCls}>
                <option value="">Sin especificar</option>
                {TIPOS_INMUEBLE.map((t) => (
                  <option key={t} value={t}>{ETIQUETAS_TIPO_INMUEBLE[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Valor estimado (€)</label>
              <input name="valor_estimado" type="number" min="0" step="1000" defaultValue={propietario.valor_estimado ?? ""} className={inputCls} placeholder="250 000" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fuente del lead</label>
              <select name="fuente_lead" defaultValue={propietario.fuente_lead ?? ""} className={selectCls}>
                <option value="">Sin especificar</option>
                {FUENTES_LEAD.map((f) => (
                  <option key={f} value={f}>{ETIQUETAS_FUENTE_LEAD[f]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Último contacto</label>
              <input name="fecha_ultimo_contacto" type="date" defaultValue={aFechaInput(propietario.fecha_ultimo_contacto)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Próxima acción</label>
              <input name="fecha_proxima_accion" type="date" defaultValue={aFechaInput(propietario.fecha_proxima_accion)} className={inputCls} />
            </div>
          </div>
        </section>

        {/* Notas */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            📝 Notas
          </h3>
          <textarea
            name="notas"
            rows={4}
            defaultValue={propietario.notas ?? ""}
            className={`${inputCls} resize-none`}
            placeholder="Observaciones, notas del propietario..."
          />
        </section>

        {/* Documentos */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            📄 Documentos
          </h3>
          <SubidaDocumentos
            entidadTipo="propietario"
            entidadId={propietario.id}
            tenantId={tenantId}
            documentos={documentos}
          />
        </section>
      </div>

      {/* Barra de guardado */}
      <div className="shrink-0 border-t px-5 py-3 flex items-center gap-3 bg-card">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {pending ? "Guardando..." : "💾 Guardar cambios"}
        </button>
        {state && "ok" in state && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✓ Guardado</span>
        )}
        {state && "error" in state && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  );
}

export function PanelPropietario({
  propietarioId,
  agentes,
  onClose,
}: {
  propietarioId: string | null;
  agentes: Agente[];
  onClose: () => void;
}) {
  const [datos, setDatos] = useState<{
    propietario: PropietarioPanel;
    documentos: Documento[];
    tenantId: string;
  } | null>(null);
  const [cargando, setCargando] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!propietarioId) {
      setDatos(null);
      return;
    }
    setCargando(true);
    setDatos(null);
    cargarPropietarioPanel(propietarioId).then((res) => {
      if (res?.propietario) {
        setDatos({
          propietario: res.propietario as PropietarioPanel,
          documentos: res.documentos,
          tenantId: res.tenantId,
        });
      }
      setCargando(false);
    });
  }, [propietarioId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const abierto = propietarioId !== null;

  return (
    <>
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        ref={panelRef}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-background shadow-2xl transition-transform duration-300",
          abierto ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ficha propietario</p>
            <h2 className="font-semibold leading-tight">
              {datos?.propietario.nombre ?? (cargando ? "Cargando..." : "—")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {cargando && (
          <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">Cargando ficha...</span>
          </div>
        )}

        {!cargando && datos && (
          <FormularioPanel
            propietario={datos.propietario}
            agentes={agentes}
            documentos={datos.documentos}
            tenantId={datos.tenantId}
            onGuardado={() => {}}
          />
        )}

        {!cargando && !datos && abierto && (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            No se pudo cargar la ficha.
          </div>
        )}
      </div>
    </>
  );
}
