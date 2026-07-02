import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TablaInmuebles } from "@/components/inmobiliaria/inmuebles/tabla-inmuebles";

const BASE = "/inmobiliaria/inmuebles";

export default async function InmobiliariaInmueblesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const params = await searchParams;
  const gestor = esGestor(usuario.rol);

  const supabase = await createClient();

  let query = supabase
    .from("inmuebles")
    .select(
      "id, referencia, direccion, zona_id, propietario_id, precio, metros_cuadrados, habitaciones, banos, tipo, estado, certificado_energetico, descripcion, fecha_publicacion, creado_en, agente_id, zonas(nombre, ciudad)"
    );

  if (!gestor) query = query.eq("agente_id", usuario.id);
  else if (params.agente_id) query = query.eq("agente_id", params.agente_id);
  if (params.estado) query = query.eq("estado", params.estado);

  const [{ data: base }, { data: usuariosData }, { data: fotos }, { data: visitasData }] =
    await Promise.all([
      query.order("creado_en", { ascending: false }),
      supabase.from("usuarios").select("id, nombre_completo").eq("tenant_id", usuario.tenant_id).eq("activo", true),
      supabase.from("documentos").select("entidad_id, url_storage, creado_en").eq("entidad_tipo", "inmueble").eq("tipo_documento", "foto").order("creado_en", { ascending: false }),
      supabase.from("eventos_agenda").select("entidad_id").eq("entidad_tipo", "inmueble").eq("tipo", "visita"),
    ]);

  const agentes: Record<string, string> = Object.fromEntries(
    (usuariosData ?? []).map((u) => [u.id, u.nombre_completo])
  );
  const fotoPorInmueble = new Map<string, string>();
  for (const f of fotos ?? []) {
    if (!fotoPorInmueble.has(f.entidad_id)) fotoPorInmueble.set(f.entidad_id, f.url_storage);
  }
  const visitasPorInmueble = new Map<string, number>();
  for (const v of visitasData ?? []) {
    visitasPorInmueble.set(v.entidad_id, (visitasPorInmueble.get(v.entidad_id) ?? 0) + 1);
  }

  const inmuebles = (base ?? []).map((i) => {
    const zona = Array.isArray(i.zonas) ? i.zonas[0] : i.zonas;
    return {
      ...i,
      foto: fotoPorInmueble.get(i.id) ?? null,
      visitas: visitasPorInmueble.get(i.id) ?? 0,
      poblacion: zona?.ciudad ?? zona?.nombre ?? null,
    };
  });

  // KPIs
  const activos = inmuebles.filter((i) => ["publicado", "visitas", "oferta"].includes(i.estado)).length;
  const nuevos30 = inmuebles.filter((i) => new Date(i.creado_en) >= new Date(Date.now() - 30 * 86400000)).length;
  const vendidos = inmuebles.filter((i) => i.estado === "vendido").length;
  const reservados = inmuebles.filter((i) => i.estado === "reservado").length;
  const sinFotos = inmuebles.filter((i) => !i.foto).length;
  const sinDoc = inmuebles.filter((i) => i.estado === "captacion" || i.estado === "preparacion").length;

  const kpis = [
    { label: "Activos", value: activos, color: "text-emerald-600" },
    { label: "Nuevos (30d)", value: nuevos30, color: "text-sky-600" },
    { label: "Vendidos", value: vendidos, color: "text-primary" },
    { label: "Reservados", value: reservados, color: "text-orange-600" },
    { label: "Sin fotos", value: sinFotos, color: "text-amber-600" },
    { label: "En preparación", value: sinDoc, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Inmuebles</h1>
        <Link
          href="/inmobiliaria/inmuebles/nuevo"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Nuevo inmueble
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-3 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {inmuebles.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium text-muted-foreground">Sin inmuebles aún</p>
          <Link href="/inmobiliaria/inmuebles/nuevo" className="mt-2 inline-block text-sm text-primary hover:underline">
            + Crear el primer inmueble
          </Link>
        </div>
      ) : (
        <TablaInmuebles inmuebles={inmuebles} agentes={agentes} basePath={BASE} />
      )}
    </div>
  );
}
