import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Filtros } from "@/components/asesor/propietarios/filtros";
import { VistaSwitcher } from "@/components/asesor/propietarios/vista-switcher";
import { Kanban } from "@/components/asesor/propietarios/kanban";
import { Tabla } from "@/components/asesor/propietarios/tabla";
import type { Propietario } from "./constantes";

export default async function PropietariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const params = await searchParams;
  const vista = params.vista === "tabla" ? "tabla" : "kanban";

  const supabase = await createClient();
  let query = supabase
    .from("propietarios")
    .select(
      "id, nombre, telefono, email, whatsapp, direccion, tipo_inmueble, estado, valor_estimado, fecha_ultimo_contacto, fecha_proxima_accion, fuente_lead, guion_captacion, notas, creado_en"
    )
    .eq("agente_id", usuario.id);

  if (params.estado) query = query.eq("estado", params.estado);
  if (params.tipo_inmueble) query = query.eq("tipo_inmueble", params.tipo_inmueble);

  const { data } = await query.order("creado_en", { ascending: false });
  const propietarios = (data ?? []) as Propietario[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Captaciones</h1>
        <VistaSwitcher vista={vista} />
      </div>

      <Filtros />

      {propietarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no tienes propietarios. Usa el botón + para añadir uno.
        </p>
      ) : vista === "tabla" ? (
        <Tabla propietarios={propietarios} />
      ) : (
        <Kanban propietarios={propietarios} />
      )}
    </div>
  );
}
