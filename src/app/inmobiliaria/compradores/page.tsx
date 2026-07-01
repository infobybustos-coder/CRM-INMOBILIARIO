import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Filtros } from "@/components/asesor/compradores/filtros";
import { VistaSwitcher } from "@/components/asesor/propietarios/vista-switcher";
import { Kanban } from "@/components/asesor/compradores/kanban";
import { Tabla } from "@/components/asesor/compradores/tabla";
import type { Comprador } from "@/app/asesor/compradores/constantes";

const BASE = "/inmobiliaria/compradores";

export default async function InmobiliariaCompradoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const params = await searchParams;

  const vista = params.vista === "tabla" ? "tabla" : "kanban";
  const filtrarPorAgente = !esGestor(usuario.rol);

  const supabase = await createClient();
  let query = supabase
    .from("compradores")
    .select(
      "id, nombre, telefono, email, presupuesto_min, presupuesto_max, financiacion, tipo_inmueble, zona_buscada_id, urgencia, estado, fecha_ultimo_contacto, fecha_proxima_accion, notas, creado_en"
    );

  if (filtrarPorAgente) query = query.eq("agente_id", usuario.id);
  if (params.estado) query = query.eq("estado", params.estado);
  if (params.tipo_inmueble) query = query.eq("tipo_inmueble", params.tipo_inmueble);
  if (params.presupuesto_min) query = query.gte("presupuesto_max", Number(params.presupuesto_min));
  if (params.presupuesto_max) query = query.lte("presupuesto_min", Number(params.presupuesto_max));

  const { data } = await query.order("creado_en", { ascending: false });
  const compradores = (data ?? []) as Comprador[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Compradores</h1>
        <VistaSwitcher vista={vista} />
      </div>

      <Filtros />

      {compradores.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay compradores registrados en este tenant todavía.
        </p>
      ) : vista === "tabla" ? (
        <Tabla compradores={compradores} basePath={BASE} />
      ) : (
        <Kanban compradores={compradores} basePath={BASE} />
      )}
    </div>
  );
}
