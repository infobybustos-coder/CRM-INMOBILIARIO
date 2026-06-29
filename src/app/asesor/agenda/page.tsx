import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Agenda } from "@/components/asesor/agenda";
import { crearEvento, actualizarEstadoEvento } from "./actions";

export default async function AgendaPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("eventos_agenda")
    .select("id, tipo, titulo, fecha_hora, estado")
    .eq("usuario_id", usuario.id)
    .order("fecha_hora", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Agenda</h1>
      <Agenda
        eventos={data ?? []}
        crearEventoAction={crearEvento}
        actualizarEstadoEventoAction={actualizarEstadoEvento}
      />
    </div>
  );
}
