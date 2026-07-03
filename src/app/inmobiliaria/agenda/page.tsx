import { CalendarDays } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function AgendaPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Agenda"
      descripcion="Agenda conjunta del equipo: llamadas, visitas, tasaciones y recordatorios."
      icono={CalendarDays}
    />
  );
}
