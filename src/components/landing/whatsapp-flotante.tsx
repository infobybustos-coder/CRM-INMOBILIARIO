import { MessageCircle } from "lucide-react";

const NUMERO_WHATSAPP = "34681810919";
const MENSAJE_POR_DEFECTO =
  "Hola 👋, estoy mirando el CRM Inmobiliario y tengo una duda antes de crear mi cuenta.";

export function WhatsAppFlotante() {
  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAJE_POR_DEFECTO)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] py-3 pr-4 pl-3 text-sm font-medium text-white shadow-lg shadow-black/10 transition-all hover:pr-5"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-40" />
      <MessageCircle className="size-5 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100">
        ¿Dudas? Escríbenos
      </span>
    </a>
  );
}
