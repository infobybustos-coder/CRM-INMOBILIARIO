import { requireInmobiliariaEfectivo } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarConversaciones, listarMensajes, resolverTarjeta } from "@/lib/mensajes/db";
import { marcarConversacionLeida } from "./actions";
import { ListaConversaciones } from "@/components/inmobiliaria/mensajes/lista-conversaciones";
import { HiloMensajes } from "@/components/inmobiliaria/mensajes/hilo-mensajes";
import { FormularioMensaje } from "@/components/inmobiliaria/mensajes/formulario-mensaje";
import { TarjetaEntidad } from "@/components/inmobiliaria/mensajes/tarjeta-entidad";
import { NuevaConversacionBoton } from "@/components/inmobiliaria/mensajes/nueva-conversacion";
import { MarcarLeido } from "@/components/soporte/marcar-leido";

export default async function MensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c: conversacionId } = await searchParams;
  const usuario = await requireInmobiliariaEfectivo();
  const admin = createAdminClient();

  const conversaciones = await listarConversaciones(admin, usuario.id);
  const seleccionada = conversacionId ? conversaciones.find((c) => c.id === conversacionId) : undefined;

  const [mensajes, tarjetaFija] = await Promise.all([
    seleccionada ? listarMensajes(admin, usuario.tenant_id, seleccionada.id) : Promise.resolve([]),
    seleccionada?.entidadTipo && seleccionada.entidadId
      ? resolverTarjeta(admin, usuario.tenant_id, seleccionada.entidadTipo, seleccionada.entidadId)
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mensajes</h1>
          <p className="text-sm text-muted-foreground">Habla con tu equipo sin salir de Ambraio.</p>
        </div>
        <NuevaConversacionBoton />
      </div>

      <div className="flex h-[75vh] overflow-hidden rounded-lg border">
        <ListaConversaciones conversaciones={conversaciones} seleccionadaId={seleccionada?.id} />

        {seleccionada ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <MarcarLeido conversacionId={seleccionada.id} marcarLeidoAction={marcarConversacionLeida} />
            <div className="space-y-2 border-b p-3">
              <p className="text-sm font-medium">{seleccionada.otroNombre}</p>
              {tarjetaFija && <TarjetaEntidad datos={tarjetaFija} />}
            </div>
            <HiloMensajes
              conversacionId={seleccionada.id}
              mensajesIniciales={mensajes}
              miUsuarioId={usuario.id}
              otraUltimaLectura={seleccionada.otraUltimaLectura}
            />
            <FormularioMensaje conversacionId={seleccionada.id} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            Elige una conversación de la lista o crea una nueva.
          </div>
        )}
      </div>
    </div>
  );
}
