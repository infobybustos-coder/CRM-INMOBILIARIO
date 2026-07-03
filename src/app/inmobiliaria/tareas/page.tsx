import { CheckSquare } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function TareasPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Tareas"
      descripcion="Tareas asignadas a cada miembro del equipo."
      icono={CheckSquare}
    />
  );
}
