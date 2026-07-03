import { BarChart3 } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function RendimientoPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Rendimiento"
      descripcion="Informes de rendimiento por agente y por periodo."
      icono={BarChart3}
    />
  );
}
