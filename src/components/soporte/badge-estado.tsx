import { cn } from "@/lib/utils";
import type { EstadoConversacion } from "@/lib/soporte/tipos";

const ESTILOS: Record<EstadoConversacion, { texto: string; clase: string }> = {
  abierta: { texto: "Abierta", clase: "bg-sky-500/10 text-sky-600 dark:text-sky-500" },
  en_proceso: { texto: "En proceso", clase: "bg-amber-500/10 text-amber-600 dark:text-amber-500" },
  esperando_respuesta: {
    texto: "Esperando respuesta",
    clase: "bg-violet-500/10 text-violet-600 dark:text-violet-500",
  },
  resuelta: { texto: "Resuelta", clase: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" },
};

export function BadgeEstado({ estado, className }: { estado: EstadoConversacion; className?: string }) {
  const { texto, clase } = ESTILOS[estado];
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", clase, className)}>
      {texto}
    </span>
  );
}
