import { MessageCircle } from "lucide-react";

export function WhatsAppBoton({ telefono, nombre }: { telefono: string | null | undefined; nombre?: string | null }) {
  if (!telefono) return null;
  const numero = telefono.replace(/\D/g, "");
  if (!numero) return null;

  const mensaje = nombre ? `Hola ${nombre}, ` : "Hola, ";
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Contactar por WhatsApp"
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10"
    >
      <MessageCircle className="size-3.5" />
      WhatsApp
    </a>
  );
}
