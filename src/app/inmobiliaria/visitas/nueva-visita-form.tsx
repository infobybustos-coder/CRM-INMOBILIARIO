"use client";

import { useActionState, useState } from "react";
import { crearVisita } from "./actions";
import { Plus, X, CalendarPlus } from "lucide-react";

type Selector = { id: string; nombre?: string; direccion?: string; nombre_completo?: string };

const inp = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50";

export function NuevaVisitaForm({
  inmuebles = [],
  compradores = [],
  agentes = [],
  esGestor = false,
  userId = "",
}: {
  inmuebles?: Selector[];
  compradores?: Selector[];
  agentes?: Selector[];
  esGestor?: boolean;
  userId?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [, formAction, pending] = useActionState(
    async (_: unknown, fd: FormData) => {
      const r = await crearVisita(fd);
      if (r && "ok" in r) setAbierto(false);
      return r;
    },
    null
  );

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <CalendarPlus className="size-4" />
        Programar nueva visita
      </button>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Nueva visita</h3>
        <button type="button" onClick={() => setAbierto(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
          <X className="size-4" />
        </button>
      </div>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Título *</label>
          <input name="titulo" required placeholder="ej. Visita piso Calle Mayor 12" className={inp} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fecha y hora *</label>
          <input name="fecha_hora" type="datetime-local" required className={inp} />
        </div>

        {inmuebles.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">🏡 Inmueble</label>
            <select name="entidad_id" className={inp}>
              <option value="">Sin inmueble</option>
              {inmuebles.map(i => (
                <option key={i.id} value={i.id}>{i.direccion ?? i.id}</option>
              ))}
            </select>
            <input type="hidden" name="entidad_tipo" value="inmueble" />
          </div>
        )}

        {compradores.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">👤 Cliente</label>
            <select name="comprador_id" className={inp}>
              <option value="">Sin cliente</option>
              {compradores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {esGestor && agentes.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">👨‍💼 Asesor</label>
            <select name="usuario_id" className={inp} defaultValue={userId}>
              {agentes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre_completo}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Notas</label>
          <textarea name="descripcion" rows={2} placeholder="Detalles de la visita..." className={`${inp} resize-none`} />
        </div>

        <div className="sm:col-span-2 flex gap-2 pt-1">
          <button type="submit" disabled={pending}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {pending ? "Guardando..." : "✓ Guardar visita"}
          </button>
          <button type="button" onClick={() => setAbierto(false)}
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
