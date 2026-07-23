import { Clock } from "lucide-react";
import { eliminarMiembro } from "@/app/inmobiliaria/equipo/actions";
import { BotonEliminar } from "@/components/inmobiliaria/boton-eliminar";
import { cn } from "@/lib/utils";
import type { AdminFila } from "@/app/inmobiliaria/administradores/constantes";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Fila({ admin, esUsuarioActual }: { admin: AdminFila; esUsuarioActual: boolean }) {
  return (
    <div className="rounded-xl border p-4 transition-colors hover:bg-accent/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {iniciales(admin.nombreCompleto)}
          </span>
          <div>
            <p className="font-medium">
              {admin.nombreCompleto}
              {esUsuarioActual && <span className="ml-1.5 text-xs text-muted-foreground">(Tú)</span>}
            </p>
            <p className="text-xs text-muted-foreground">{admin.email}</p>
          </div>
        </div>

        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            admin.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
          )}
        >
          {admin.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {admin.ultimoAcceso
            ? `Último acceso: ${new Date(admin.ultimoAcceso).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}`
            : "Sin accesos registrados"}
        </span>

        {!esUsuarioActual && (
          <BotonEliminar
            id={admin.id}
            mensaje={`¿Eliminar a ${admin.nombreCompleto} como administrador? Dejará de tener acceso al CRM.`}
            eliminarAction={eliminarMiembro}
          />
        )}
      </div>
    </div>
  );
}

export function Tabla({
  admins,
  usuarioActualId,
}: {
  admins: AdminFila[];
  usuarioActualId: string;
}) {
  if (admins.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay administradores registrados todavía.</p>;
  }

  return (
    <div className="space-y-2">
      {admins.map((a) => (
        <Fila key={a.id} admin={a} esUsuarioActual={a.id === usuarioActualId} />
      ))}
    </div>
  );
}
