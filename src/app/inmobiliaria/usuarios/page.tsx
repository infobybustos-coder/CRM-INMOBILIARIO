import { UsersRound } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function UsuariosPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Usuarios"
      descripcion="Invita y gestiona los usuarios de tu equipo."
      icono={UsersRound}
    />
  );
}
