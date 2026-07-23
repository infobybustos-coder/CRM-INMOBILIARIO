import { createAdminClient } from "@/lib/supabase/admin";
import { listarConversacionesAdmin, listarMensajes } from "@/lib/soporte/db";
import { responderComoSoporte, marcarLeidoSoporte } from "./actions";
import { ListaConversacionesAdmin } from "@/components/superadmin/soporte/lista-conversaciones-admin";
import { FiltrosSoporte } from "@/components/superadmin/soporte/filtros-soporte";
import { FichaClienteConversacion } from "@/components/superadmin/soporte/ficha-cliente-conversacion";
import { SelectorEstado } from "@/components/superadmin/soporte/selector-estado";
import { HiloMensajes } from "@/components/soporte/hilo-mensajes";
import { FormularioMensaje } from "@/components/soporte/formulario-mensaje";
import { MarcarLeido } from "@/components/soporte/marcar-leido";
import { SoporteBuscador } from "@/components/superadmin/soporte-buscador";

export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; q?: string; estado?: string }>;
}) {
  const { c: conversacionId, q, estado } = await searchParams;
  const admin = createAdminClient();

  const todas = await listarConversacionesAdmin(admin);
  const filtro = q?.trim().toLowerCase();
  const conversaciones = todas.filter((c) => {
    if (estado && c.estado !== estado) return false;
    if (!filtro) return true;
    return (
      c.asunto.toLowerCase().includes(filtro) ||
      c.clienteNombre.toLowerCase().includes(filtro) ||
      c.clienteEmail.toLowerCase().includes(filtro) ||
      c.tenantNombre.toLowerCase().includes(filtro)
    );
  });

  const seleccionada = conversacionId ? conversaciones.find((c) => c.id === conversacionId) : undefined;
  const mensajes = seleccionada ? await listarMensajes(admin, seleccionada.id) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Soporte</h1>
        <p className="text-sm text-muted-foreground">
          Conversaciones de soporte de todos los clientes, en tiempo real.
        </p>
      </div>

      <FiltrosSoporte />

      <div className="flex h-[75vh] overflow-hidden rounded-lg border">
        <ListaConversacionesAdmin
          conversaciones={conversaciones}
          seleccionadaId={seleccionada?.id}
          hrefBase="/superadmin/soporte?c="
          className="w-80 shrink-0 border-r"
        />

        {seleccionada ? (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <MarcarLeido conversacionId={seleccionada.id} marcarLeidoAction={marcarLeidoSoporte} />
              <div className="flex items-center justify-between gap-2 border-b p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{seleccionada.asunto}</p>
                  <p className="truncate text-xs text-muted-foreground">{seleccionada.clienteNombre}</p>
                </div>
                <SelectorEstado conversacionId={seleccionada.id} estadoActual={seleccionada.estado} />
              </div>
              <HiloMensajes mensajes={mensajes} autorPropio="soporte" />
              <FormularioMensaje
                conversacionId={seleccionada.id}
                onEnviar={responderComoSoporte}
                placeholder="Responder como soporte..."
              />
            </div>
            <FichaClienteConversacion conversacion={seleccionada} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            Elige una conversación de la lista.
          </div>
        )}
      </div>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Buscar cualquier cuenta (por teléfono, email o nombre)
        </summary>
        <div className="mt-4">
          <SoporteBuscador />
        </div>
      </details>
    </div>
  );
}
