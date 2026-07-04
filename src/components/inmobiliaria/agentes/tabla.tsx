import Link from "next/link";
import { Eye, BarChart3 } from "lucide-react";
import { eliminarMiembro } from "@/app/inmobiliaria/equipo/actions";
import { BotonEliminar } from "@/components/inmobiliaria/boton-eliminar";
import { cn } from "@/lib/utils";
import type { AgenteFila } from "@/app/inmobiliaria/agentes/constantes";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Fila({ agente }: { agente: AgenteFila }) {
  return (
    <div className="rounded-xl border p-4 transition-colors hover:bg-accent/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
            agente.activoHoy
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              agente.activoHoy ? "bg-emerald-500" : "bg-muted-foreground/50"
            )}
          />
          {agente.activoHoy ? "Activo hoy" : "Sin actividad hoy"}
        </span>
        <span className="text-xs text-muted-foreground">
          {agente.ultimaActividad
            ? `Última actividad: ${new Date(agente.ultimaActividad).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}`
            : "Sin actividad registrada"}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {iniciales(agente.nombreCompleto)}
        </span>
        <div>
          <p className="font-medium">{agente.nombreCompleto}</p>
          <p className="text-xs text-muted-foreground">{agente.email}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{agente.totalPropietarios}</span> propietarios
        </span>
        <span>
          <span className="font-medium text-foreground">{agente.totalCompradores}</span> compradores
        </span>
        <span>
          <span className="font-medium text-foreground">{agente.tareasPendientes}</span> tareas pendientes
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        <Link
          href={`/inmobiliaria/agentes/${agente.id}`}
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <Eye className="size-3.5" /> Ver perfil
        </Link>
        <Link
          href={`/inmobiliaria/rendimiento?agente=${agente.id}`}
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <BarChart3 className="size-3.5" /> Ver rendimiento
        </Link>
        <BotonEliminar
          id={agente.id}
          mensaje={`¿Eliminar a ${agente.nombreCompleto} del equipo? Dejará de tener acceso al CRM.`}
          eliminarAction={eliminarMiembro}
          className="ml-auto"
        />
      </div>
    </div>
  );
}

export function Tabla({ agentes }: { agentes: AgenteFila[] }) {
  if (agentes.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay asesores registrados todavía.</p>;
  }

  return (
    <div className="space-y-2">
      {agentes.map((a) => (
        <Fila key={a.id} agente={a} />
      ))}
    </div>
  );
}
