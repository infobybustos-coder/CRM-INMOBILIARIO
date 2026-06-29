import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Filtros } from "@/components/asesor/inmuebles/filtros";
import { VistaSwitcher } from "@/components/asesor/propietarios/vista-switcher";
import { Kanban } from "@/components/asesor/inmuebles/kanban";
import { Tabla } from "@/components/asesor/inmuebles/tabla";
import type { Inmueble } from "./constantes";

export default async function InmueblesPage({
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
    .from("inmuebles")
    .select(
      "id, referencia, direccion, zona_id, propietario_id, precio, metros_cuadrados, habitaciones, banos, tipo, estado, certificado_energetico, descripcion, fecha_publicacion, creado_en"
    )
    .eq("agente_id", usuario.id);

  if (params.estado) query = query.eq("estado", params.estado);
  if (params.tipo) query = query.eq("tipo", params.tipo);
  if (params.precio_min) query = query.gte("precio", Number(params.precio_min));
  if (params.precio_max) query = query.lte("precio", Number(params.precio_max));

  const { data } = await query.order("creado_en", { ascending: false });
  const base = data ?? [];

  const { data: fotos } = base.length
    ? await supabase
        .from("documentos")
        .select("entidad_id, url_storage, creado_en")
        .eq("entidad_tipo", "inmueble")
        .eq("tipo_documento", "foto")
        .in("entidad_id", base.map((i) => i.id))
        .order("creado_en", { ascending: false })
    : { data: [] };

  const fotoPorInmueble = new Map<string, string>();
  for (const f of fotos ?? []) {
    if (!fotoPorInmueble.has(f.entidad_id)) fotoPorInmueble.set(f.entidad_id, f.url_storage);
  }

  const inmuebles = base.map((i) => ({
    ...i,
    foto: fotoPorInmueble.get(i.id) ?? null,
  })) as Inmueble[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Inmuebles</h1>
        <VistaSwitcher vista={vista} />
      </div>

      <Filtros />

      {inmuebles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no tienes inmuebles registrados. Usa el botón + para añadir uno.
        </p>
      ) : vista === "tabla" ? (
        <Tabla inmuebles={inmuebles} />
      ) : (
        <Kanban inmuebles={inmuebles} />
      )}
    </div>
  );
}
