import { Home } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function InmueblesPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Inmuebles"
      descripcion="El catálogo de inmuebles de la inmobiliaria, con filtros por estado y agente."
      icono={Home}
    />
  );
}
