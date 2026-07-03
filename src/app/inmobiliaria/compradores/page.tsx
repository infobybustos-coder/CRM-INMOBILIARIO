import { UserSearch } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function CompradoresPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Compradores"
      descripcion="La cartera de compradores de todo el equipo."
      icono={UserSearch}
    />
  );
}
