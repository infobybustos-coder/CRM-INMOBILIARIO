import { UserCog } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function AgentesPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Agentes"
      descripcion="Gestión de los agentes del equipo y sus captaciones asignadas."
      icono={UserCog}
    />
  );
}
