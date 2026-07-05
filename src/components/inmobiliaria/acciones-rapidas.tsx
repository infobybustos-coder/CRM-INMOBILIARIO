"use client";

import { Plus, Building2, UserSearch, CalendarPlus } from "lucide-react";
import { NuevoPropietario } from "@/components/inmobiliaria/propietarios/nuevo-propietario";
import { NuevoInmueble } from "@/components/inmobiliaria/inmuebles/nuevo-inmueble";
import { NuevoComprador } from "@/components/inmobiliaria/compradores/nuevo-comprador";
import { NuevaVisita } from "@/components/inmobiliaria/visitas/nueva-visita";
import { cn } from "@/lib/utils";

type Opcion = { id: string; etiqueta: string };

function AccionRapidaBoton({
  onClick,
  icono: Icono,
  label,
  color,
}: {
  onClick: () => void;
  icono: typeof Plus;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center gap-2 rounded-lg p-4 text-center transition-opacity hover:opacity-80",
        color
      )}
    >
      <Icono className="size-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function AccionesRapidas({
  inmuebles,
  compradores,
  asesores,
}: {
  inmuebles: Opcion[];
  compradores: Opcion[];
  asesores: Opcion[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <NuevoPropietario>
        {(abrir) => (
          <AccionRapidaBoton
            onClick={abrir}
            icono={Plus}
            label="Nuevo propietario"
            color="bg-violet-500/10 text-violet-600"
          />
        )}
      </NuevoPropietario>
      <NuevoInmueble>
        {(abrir) => (
          <AccionRapidaBoton
            onClick={abrir}
            icono={Building2}
            label="Nuevo inmueble"
            color="bg-sky-500/10 text-sky-600"
          />
        )}
      </NuevoInmueble>
      <NuevoComprador>
        {(abrir) => (
          <AccionRapidaBoton
            onClick={abrir}
            icono={UserSearch}
            label="Nuevo comprador"
            color="bg-emerald-500/10 text-emerald-600"
          />
        )}
      </NuevoComprador>
      <NuevaVisita inmuebles={inmuebles} compradores={compradores} asesores={asesores} gestor>
        {(abrir) => (
          <AccionRapidaBoton
            onClick={abrir}
            icono={CalendarPlus}
            label="Nueva visita"
            color="bg-amber-500/10 text-amber-600"
          />
        )}
      </NuevaVisita>
    </div>
  );
}
