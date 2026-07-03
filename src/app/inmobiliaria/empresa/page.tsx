import { Building2 } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function EmpresaPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Empresa"
      descripcion="Datos de la inmobiliaria: nombre, logo, color de marca y país."
      icono={Building2}
    />
  );
}
