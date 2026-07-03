import { Users } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function PropietariosPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Propietarios"
      descripcion="Aquí verás y gestionarás las captaciones de todo el equipo."
      icono={Users}
    />
  );
}
