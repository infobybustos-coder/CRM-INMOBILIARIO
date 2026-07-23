import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarConversacionesCliente, listarMensajes } from "@/lib/soporte/db";
import { enviarMensajeCliente, marcarLeidoCliente, cerrarConversacionCliente } from "@/lib/soporte/actions";
import { ListaConversaciones } from "@/components/soporte/lista-conversaciones";
import { HiloMensajes } from "@/components/soporte/hilo-mensajes";
import { FormularioMensaje } from "@/components/soporte/formulario-mensaje";
import { NuevaConversacion } from "@/components/soporte/nueva-conversacion";
import { BadgeEstado } from "@/components/soporte/badge-estado";
import { MarcarLeido } from "@/components/soporte/marcar-leido";

const BASE_HREF = "/inmobiliaria/soporte";

export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "inmobiliaria") redirect("/asesor");

  const { c: conversacionId } = await searchParams;
  const admin = createAdminClient();

  const conversaciones = await listarConversacionesCliente(admin, usuario.id);
  const seleccionada = conversacionId ? conversaciones.find((c) => c.id === conversacionId) : undefined;
  const mensajes = seleccionada ? await listarMensajes(admin, seleccionada.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Centro de ayuda</h1>
        <NuevaConversacion baseHref={BASE_HREF} />
      </div>

      <div className="flex h-[75vh] overflow-hidden rounded-lg border">
        <ListaConversaciones
          conversaciones={conversaciones}
          baseHref={BASE_HREF}
          seleccionadaId={seleccionada?.id}
          className={seleccionada ? "hidden w-72 shrink-0 border-r md:block" : "w-full md:block md:w-72 md:shrink-0 md:border-r"}
        />

        {seleccionada ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <MarcarLeido conversacionId={seleccionada.id} marcarLeidoAction={marcarLeidoCliente} />
            <div className="flex items-center justify-between gap-2 border-b p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Link
                  href={BASE_HREF}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent md:hidden"
                  aria-label="Volver a conversaciones"
                >
                  <ArrowLeft className="size-4" />
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{seleccionada.asunto}</p>
                  <BadgeEstado estado={seleccionada.estado} />
                </div>
              </div>
              {seleccionada.estado !== "resuelta" && (
                <form action={async () => {
                  "use server";
                  await cerrarConversacionCliente(seleccionada.id);
                }}>
                  <button
                    type="submit"
                    className="flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
                  >
                    <CheckCircle2 className="size-3.5" /> Marcar resuelta
                  </button>
                </form>
              )}
            </div>
            <HiloMensajes mensajes={mensajes} autorPropio="cliente" />
            <FormularioMensaje conversacionId={seleccionada.id} onEnviar={enviarMensajeCliente} />
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground md:flex">
            Elige una conversación de la lista o crea una nueva para escribirnos.
          </div>
        )}
      </div>
    </div>
  );
}
