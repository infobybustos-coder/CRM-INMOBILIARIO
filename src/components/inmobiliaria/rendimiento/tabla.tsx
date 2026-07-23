import Link from "next/link";
import { Home, Award, Phone, CalendarClock, CheckCheck, Activity } from "lucide-react";
import type { RendimientoFila } from "@/app/inmobiliaria/rendimiento/constantes";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const METRICAS: {
  clave: keyof RendimientoFila;
  etiqueta: string;
  icono: typeof Home;
}[] = [
  { clave: "captaciones", etiqueta: "Captaciones", icono: Home },
  { clave: "exclusivas", etiqueta: "Exclusivas", icono: Award },
  { clave: "seguimientos", etiqueta: "Seguimientos", icono: Phone },
  { clave: "visitas", etiqueta: "Visitas", icono: CalendarClock },
  { clave: "tareas", etiqueta: "Tareas", icono: CheckCheck },
  { clave: "actividadHoy", etiqueta: "Actividad hoy", icono: Activity },
];

function Fila({ fila }: { fila: RendimientoFila }) {
  return (
    <div className="rounded-xl border p-4 transition-colors hover:bg-accent/40">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {iniciales(fila.nombreCompleto)}
        </span>
        <Link href={`/inmobiliaria/agentes/${fila.agenteId}`} className="font-medium hover:underline">
          {fila.nombreCompleto}
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {METRICAS.map(({ clave, etiqueta, icono: Icono }) => (
          <div key={clave} className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 p-2 text-center">
            <Icono className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">{fila[clave]}</span>
            <span className="text-[11px] text-muted-foreground">{etiqueta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Tabla({ filas }: { filas: RendimientoFila[] }) {
  if (filas.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay asesores registrados todavía.</p>;
  }

  return (
    <div className="space-y-2">
      {filas.map((f) => (
        <Fila key={f.agenteId} fila={f} />
      ))}
    </div>
  );
}
