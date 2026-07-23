import Link from "next/link";
import type { RendimientoFila } from "@/app/inmobiliaria/rendimiento/constantes";
import { cn } from "@/lib/utils";

function puntuacionTotal(fila: RendimientoFila): number {
  return (
    fila.captaciones + fila.exclusivas + fila.seguimientos + fila.visitas + fila.tareas + fila.actividadHoy
  );
}

export function Grafico({ filas }: { filas: RendimientoFila[] }) {
  if (filas.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay asesores registrados todavía.</p>;
  }

  const ordenadas = [...filas].sort((a, b) => puntuacionTotal(b) - puntuacionTotal(a));
  const max = Math.max(1, ...ordenadas.map(puntuacionTotal));

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Actividad total del periodo (suma de todas las métricas)
      </h2>
      <div className="space-y-2.5">
        {ordenadas.map((f, i) => {
          const total = puntuacionTotal(f);
          return (
            <div key={f.agenteId} className="flex items-center gap-2">
              <Link
                href={`/inmobiliaria/agentes/${f.agenteId}`}
                className="w-32 shrink-0 truncate text-sm hover:underline"
                title={f.nombreCompleto}
              >
                {f.nombreCompleto}
              </Link>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", i === 0 ? "bg-primary" : "bg-muted-foreground/40")}
                  style={{ width: `${(total / max) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-medium">{total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
