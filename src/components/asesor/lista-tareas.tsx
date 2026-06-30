"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Pencil, Check, X, FileDown, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

type Origen = "tarea" | "evento";

type TareaItem = {
  id: string;
  origen: Origen;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: string;
  entidad_tipo: string | null;
  entidad_nombre: string | null;
  entidad_href: string;
  etiqueta_origen: string | null;
};

type EditarTareaState = { error: string } | { ok: true } | null;

const ETIQUETA_TIPO: Record<string, string> = {
  propietario: "Propietario",
  comprador: "Comprador",
  inmueble: "Inmueble",
};

function claveDia(fecha: string | Date): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function aFechaInput(fecha: string | null) {
  if (!fecha) return "";
  return fecha.slice(0, 10);
}

function combinarFecha(fechaOriginal: string | null, nuevaFecha: string): string | null {
  if (!nuevaFecha) return null;
  if (!fechaOriginal) return nuevaFecha;
  const orig = new Date(fechaOriginal);
  const [y, m, d] = nuevaFecha.split("-").map(Number);
  const combinado = new Date(orig);
  combinado.setFullYear(y, m - 1, d);
  return combinado.toISOString();
}

function etiquetaRelacion(t: TareaItem): string {
  if (t.entidad_nombre) {
    return `${ETIQUETA_TIPO[t.entidad_tipo ?? ""] ?? t.entidad_tipo}: ${t.entidad_nombre}`;
  }
  if (t.etiqueta_origen) return t.etiqueta_origen;
  if (t.entidad_tipo) return ETIQUETA_TIPO[t.entidad_tipo] ?? t.entidad_tipo;
  return "Tarea";
}

export function ListaTareas({
  items,
  alternarTareaAction,
  editarTareaAction,
  cancelarTareaAction,
}: {
  items: TareaItem[];
  alternarTareaAction: (id: string, completada: boolean, origen: Origen) => Promise<void>;
  editarTareaAction: (
    id: string,
    titulo: string,
    fechaVencimiento: string | null,
    origen: Origen
  ) => Promise<EditarTareaState>;
  cancelarTareaAction: (id: string, origen: Origen) => Promise<void>;
}) {
  const [completadas, setCompletadas] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((t) => [t.id, t.estado === "completada"]))
  );
  const [datos, setDatos] = useState<Record<string, { titulo: string; fecha: string | null }>>(
    Object.fromEntries(items.map((t) => [t.id, { titulo: t.titulo, fecha: t.fecha_vencimiento }]))
  );
  const [canceladas, setCanceladas] = useState<Record<string, boolean>>({});
  const [editando, setEditando] = useState<string | null>(null);
  const [filtroFecha, setFiltroFecha] = useState("");

  function alternar(t: TareaItem, valor: boolean) {
    setCompletadas((prev) => ({ ...prev, [t.id]: valor }));
    alternarTareaAction(t.id, valor, t.origen);
  }

  function cancelar(t: TareaItem) {
    if (!window.confirm(`¿Cancelar la tarea "${t.titulo}"?`)) return;
    setCanceladas((prev) => ({ ...prev, [t.id]: true }));
    cancelarTareaAction(t.id, t.origen);
  }

  async function guardarEdicion(t: TareaItem, titulo: string, fecha: string) {
    const fechaFinal = combinarFecha(datos[t.id].fecha, fecha);
    const resultado = await editarTareaAction(t.id, titulo, fechaFinal, t.origen);
    if (resultado && "ok" in resultado) {
      setDatos((prev) => ({ ...prev, [t.id]: { titulo, fecha: fechaFinal } }));
      setEditando(null);
    }
    return resultado;
  }

  const filtrados = useMemo(() => {
    const visibles = items.filter((t) => !canceladas[t.id]);
    if (!filtroFecha) return visibles;
    return visibles.filter(
      (t) => t.fecha_vencimiento && aFechaInput(t.fecha_vencimiento) === filtroFecha
    );
  }, [items, filtroFecha, canceladas]);

  const claveHoy = claveDia(new Date());
  const ahora = new Date();

  const pendientes = filtrados.filter((t) => !completadas[t.id]);
  const hechas = filtrados.filter((t) => completadas[t.id]);

  const vencidas = pendientes.filter(
    (t) => t.fecha_vencimiento && new Date(t.fecha_vencimiento) < ahora && claveDia(t.fecha_vencimiento) !== claveHoy
  );
  const hoy = pendientes.filter((t) => t.fecha_vencimiento && claveDia(t.fecha_vencimiento) === claveHoy);
  const proximas = pendientes.filter(
    (t) => !t.fecha_vencimiento || (new Date(t.fecha_vencimiento) > ahora && claveDia(t.fecha_vencimiento) !== claveHoy)
  );

  function exportarPdf() {
    const ventana = window.open("", "_blank");
    if (!ventana) return;

    const fila = (t: TareaItem) => {
      const d = datos[t.id];
      const vencida = !completadas[t.id] && d.fecha && new Date(d.fecha) < ahora && claveDia(d.fecha) !== claveHoy;
      return `<tr>
        <td>${completadas[t.id] ? "✔" : ""}</td>
        <td>${d.titulo}</td>
        <td>${etiquetaRelacion(t)}</td>
        <td style="${vencida ? "color:#dc2626;font-weight:600" : ""}">${
          d.fecha ? new Date(d.fecha).toLocaleDateString("es-ES") : "—"
        }${vencida ? " (urgente)" : ""}</td>
      </tr>`;
    };

    ventana.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tareas</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1c1c1c; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { color: #666; margin-top: 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 12px; }
            th { background: #f3f3f3; }
          </style>
        </head>
        <body>
          <h1>Tareas${filtroFecha ? " · " + new Date(filtroFecha).toLocaleDateString("es-ES") : ""}</h1>
          <p>Generado el ${new Date().toLocaleDateString("es-ES")}</p>
          <table>
            <thead><tr><th>Hecha</th><th>Tarea</th><th>Relacionado con</th><th>Fecha</th></tr></thead>
            <tbody>${filtrados.map(fila).join("")}</tbody>
          </table>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  }

  function fila(t: TareaItem) {
    const completada = completadas[t.id];
    const d = datos[t.id];
    const vencida =
      !completada && d.fecha && new Date(d.fecha) < ahora && claveDia(d.fecha) !== claveHoy;
    const cercaVencimiento = !completada && !vencida && d.fecha && claveDia(d.fecha) === claveHoy;
    const enEdicion = editando === t.id;

    if (enEdicion) {
      return (
        <FormaEdicion
          key={t.id}
          item={t}
          tituloInicial={d.titulo}
          fechaInicial={aFechaInput(d.fecha)}
          onCancelar={() => setEditando(null)}
          onGuardar={guardarEdicion}
        />
      );
    }

    return (
      <div
        key={t.id}
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
          completada && "opacity-60",
          vencida && "border-red-500/60 bg-red-500/5"
        )}
      >
        <button
          type="button"
          onClick={() => alternar(t, !completada)}
          aria-label={completada ? "Marcar como pendiente" : "Marcar como hecha"}
          className="shrink-0"
        >
          <CheckCircle2
            className={cn(
              "size-6 transition-colors",
              completada ? "fill-emerald-500 text-emerald-500" : "text-muted-foreground"
            )}
          />
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium",
              completada && "text-emerald-600 line-through",
              vencida && "text-red-600",
              cercaVencimiento && "text-amber-600"
            )}
          >
            {d.titulo}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.entidad_nombre ? (
              <Link href={t.entidad_href} className="underline">
                {etiquetaRelacion(t)}
              </Link>
            ) : (
              etiquetaRelacion(t)
            )}
            {d.fecha && (
              <>
                {" · "}
                <span
                  className={cn(
                    "font-medium",
                    vencida && "text-red-600",
                    cercaVencimiento && "text-amber-600",
                    completada && "text-emerald-600"
                  )}
                >
                  {new Date(d.fecha).toLocaleDateString("es-ES")}
                </span>
              </>
            )}
          </p>
        </div>
        {vencida && (
          <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
            Urgente
          </span>
        )}
        {!completada && (
          <>
            <button
              type="button"
              onClick={() => setEditando(t.id)}
              aria-label="Editar tarea"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => cancelar(t)}
              aria-label="Cancelar tarea"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Ban className="size-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        No tienes tareas creadas. Añádelas desde la ficha de un propietario, comprador, inmueble, o desde la Agenda.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <label htmlFor="filtro_fecha" className="text-xs font-medium text-muted-foreground">
            Filtrar por fecha
          </label>
          <input
            id="filtro_fecha"
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        {filtroFecha && (
          <button
            type="button"
            onClick={() => setFiltroFecha("")}
            className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            Quitar filtro
          </button>
        )}
        <button
          type="button"
          onClick={exportarPdf}
          className="ml-auto flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          <FileDown className="size-4" />
          Exportar PDF
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          No hay tareas para esa fecha.
        </p>
      ) : (
        <>
          {vencidas.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-destructive">
                Vencidas / urgentes ({vencidas.length})
              </h2>
              <div className="space-y-2">{vencidas.map(fila)}</div>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Hoy ({hoy.length})</h2>
            {hoy.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes tareas para hoy.</p>
            ) : (
              <div className="space-y-2">{hoy.map(fila)}</div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Próximas ({proximas.length})
            </h2>
            {proximas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes más tareas próximas.</p>
            ) : (
              <div className="space-y-2">{proximas.map(fila)}</div>
            )}
          </div>

          {hechas.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Hechas ({hechas.length})</h2>
              <div className="space-y-2">{hechas.map(fila)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FormaEdicion({
  item,
  tituloInicial,
  fechaInicial,
  onCancelar,
  onGuardar,
}: {
  item: TareaItem;
  tituloInicial: string;
  fechaInicial: string;
  onCancelar: () => void;
  onGuardar: (item: TareaItem, titulo: string, fecha: string) => Promise<EditarTareaState>;
}) {
  const [titulo, setTitulo] = useState(tituloInicial);
  const [fecha, setFecha] = useState(fechaInicial);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    const resultado = await onGuardar(item, titulo, fecha);
    setGuardando(false);
    if (resultado && "error" in resultado) setError(resultado.error);
  }

  return (
    <div className="space-y-2 rounded-lg border border-primary/40 bg-muted/30 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          autoFocus
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            aria-label="Guardar cambios"
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            <Check className="size-4" />
          </button>
          <button
            type="button"
            onClick={onCancelar}
            aria-label="Cancelar edición"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
