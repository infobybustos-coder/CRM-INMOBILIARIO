import Link from "next/link";
import { Home, User, UserSearch, CalendarClock, CheckSquare, ExternalLink, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ETIQUETAS_ESTADO_INMUEBLE } from "@/app/asesor/inmuebles/constantes";
import { ETIQUETAS_ESTADO } from "@/app/asesor/propietarios/constantes";
import { ETIQUETAS_ESTADO_COMPRADOR } from "@/app/asesor/compradores/constantes";
import { ETIQUETA_ESTADO_TAREA } from "@/app/inmobiliaria/tareas/constantes";
import type { DatosTarjeta } from "@/lib/mensajes/tipos";

const ETIQUETA_ESTADO_VISITA: Record<string, string> = {
  pendiente: "Pendiente",
  completado: "Completada",
  cancelado: "Cancelada",
};

export const ICONO_ENTIDAD: Record<DatosTarjeta["entidadTipo"], LucideIcon> = {
  inmueble: Home,
  propietario: User,
  comprador: UserSearch,
  visita: CalendarClock,
  tarea: CheckSquare,
};
const ICONO = ICONO_ENTIDAD;

function formatoPrecio(valor: number): string {
  return `${valor.toLocaleString("es-ES")} €`;
}

export function TarjetaEntidad({ datos, compacta = false }: { datos: DatosTarjeta; compacta?: boolean }) {
  const Icon = ICONO[datos.entidadTipo];

  if (!datos.disponible) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        Este elemento ya no está disponible.
      </div>
    );
  }

  let titulo: string;
  const filas: { label: string; valor: string }[] = [];

  switch (datos.entidadTipo) {
    case "inmueble":
      titulo = datos.direccion;
      if (datos.referencia) filas.push({ label: "Ref", valor: datos.referencia });
      if (datos.precio !== null) filas.push({ label: "Precio", valor: formatoPrecio(datos.precio) });
      filas.push({ label: "Estado", valor: ETIQUETAS_ESTADO_INMUEBLE[datos.estado] ?? datos.estado });
      break;
    case "propietario":
      titulo = datos.nombre;
      if (datos.telefono) filas.push({ label: "Teléfono", valor: datos.telefono });
      filas.push({ label: "Estado", valor: ETIQUETAS_ESTADO[datos.estado] ?? datos.estado });
      break;
    case "comprador":
      titulo = datos.nombre;
      if (datos.presupuestoMax !== null) filas.push({ label: "Presupuesto", valor: formatoPrecio(datos.presupuestoMax) });
      filas.push({ label: "Estado", valor: ETIQUETAS_ESTADO_COMPRADOR[datos.estado] ?? datos.estado });
      break;
    case "visita":
      titulo = datos.subtitulo;
      filas.push({
        label: "Fecha",
        valor: new Date(datos.fechaHora).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }),
      });
      filas.push({ label: "Estado", valor: ETIQUETA_ESTADO_VISITA[datos.estado] ?? datos.estado });
      break;
    case "tarea":
      titulo = datos.titulo;
      if (datos.fechaVencimiento) {
        filas.push({ label: "Vence", valor: new Date(datos.fechaVencimiento).toLocaleDateString("es-ES") });
      }
      filas.push({ label: "Estado", valor: ETIQUETA_ESTADO_TAREA[datos.estado] ?? datos.estado });
      break;
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-background", compacta ? "max-w-xs" : "max-w-sm")}>
      {datos.entidadTipo === "inmueble" && datos.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={datos.imagenUrl} alt="" className="h-32 w-full object-cover" />
      )}
      <div className="space-y-1.5 p-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{titulo}</span>
        </p>
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {filas.map((f) => (
            <p key={f.label}>
              {f.label}: {f.valor}
            </p>
          ))}
        </div>
        {datos.href && (
          <Link
            href={datos.href}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Abrir ficha <ExternalLink className="size-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
