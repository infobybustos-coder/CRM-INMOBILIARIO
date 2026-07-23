import { Activity } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function ActividadPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Actividad"
      descripcion="Historial completo de actividad de todo el equipo."
      icono={Activity}
    />
  );
}
