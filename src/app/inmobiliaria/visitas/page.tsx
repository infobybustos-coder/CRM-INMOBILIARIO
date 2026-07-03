import { CalendarClock } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function VisitasPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Visitas"
      descripcion="Visitas programadas, confirmadas y su resultado."
      icono={CalendarClock}
    />
  );
}
