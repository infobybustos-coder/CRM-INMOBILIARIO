import { MessageSquare } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { PaginaEnConstruccion } from "@/components/inmobiliaria/pagina-en-construccion";

export default async function MensajesPage() {
  await requireAdminInmobiliaria();
  return (
    <PaginaEnConstruccion
      titulo="Mensajes"
      descripcion="Bandeja de mensajes centralizada del equipo. Función bloqueada por ahora."
      icono={MessageSquare}
    />
  );
}
