import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";

export function MensajesBloqueado({ esAdmin }: { esAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mensajes</h1>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <MessageSquare className="size-8 text-muted-foreground" />
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3" /> Función PRO
        </span>
        <p className="font-medium">La mensajería interna está disponible en el Plan PRO</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Habla con tu equipo sin salir de Ambraio, con conversaciones que puedes vincular a inmuebles,
          propietarios, compradores, visitas y tareas.
        </p>
        {esAdmin ? (
          <Link
            href="/inmobiliaria/suscripcion"
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Mejorar a PRO
          </Link>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Pide a un administrador de tu inmobiliaria que actualice el plan.
          </p>
        )}
      </div>
    </div>
  );
}
