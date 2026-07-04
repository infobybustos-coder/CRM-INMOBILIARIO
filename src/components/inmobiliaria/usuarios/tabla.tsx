import Link from "next/link";
import { Clock, Pencil } from "lucide-react";
import { eliminarMiembro } from "@/app/inmobiliaria/equipo/actions";
import { BotonEliminar } from "@/components/inmobiliaria/boton-eliminar";
import { ETIQUETA_ROL, COLOR_ROL, type UsuarioFila } from "@/app/inmobiliaria/usuarios/constantes";
import { cn } from "@/lib/utils";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Fila({ usuario, esUsuarioActual }: { usuario: UsuarioFila; esUsuarioActual: boolean }) {
  return (
    <div className="rounded-xl border p-4 transition-colors hover:bg-accent/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              usuario.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
            )}
          >
            {usuario.activo ? "Activo" : "Inactivo"}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              COLOR_ROL[usuario.rol] ?? COLOR_ROL.empleado
            )}
          >
            {ETIQUETA_ROL[usuario.rol] ?? usuario.rol}
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {usuario.ultimoAcceso
            ? `Último acceso: ${new Date(usuario.ultimoAcceso).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}`
            : "Sin accesos registrados"}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {iniciales(usuario.nombreCompleto)}
        </span>
        <div>
          <p className="font-medium">
            {usuario.nombreCompleto}
            {esUsuarioActual && <span className="ml-1.5 text-xs text-muted-foreground">(Tú)</span>}
          </p>
          <p className="text-xs text-muted-foreground">{usuario.email}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        <Link
          href={`/inmobiliaria/usuarios/${usuario.id}`}
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <Pencil className="size-3.5" /> Editar
        </Link>
        {!esUsuarioActual && (
          <BotonEliminar
            id={usuario.id}
            mensaje={`¿Desactivar a ${usuario.nombreCompleto}? Dejará de tener acceso al CRM.`}
            eliminarAction={eliminarMiembro}
            className="ml-auto"
          />
        )}
      </div>
    </div>
  );
}

export function Tabla({
  usuarios,
  usuarioActualId,
}: {
  usuarios: UsuarioFila[];
  usuarioActualId: string;
}) {
  if (usuarios.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay usuarios registrados todavía.</p>;
  }

  return (
    <div className="space-y-2">
      {usuarios.map((u) => (
        <Fila key={u.id} usuario={u} esUsuarioActual={u.id === usuarioActualId} />
      ))}
    </div>
  );
}
