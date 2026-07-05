import { Home, Sparkles, Award, BookmarkCheck, ImageOff, FileWarning } from "lucide-react";
import { requireInmobiliariaEfectivo, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Filtros } from "@/components/asesor/inmuebles/filtros";
import { Tabla } from "@/components/inmobiliaria/inmuebles/tabla";
import { NuevoInmueble } from "@/components/inmobiliaria/inmuebles/nuevo-inmueble";
import type { Inmueble } from "@/app/asesor/inmuebles/constantes";

type InmuebleConAgente = Inmueble & { agente_id: string | null };

export default async function InmueblesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await requireInmobiliariaEfectivo();
  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();

  let query = supabase
    .from("inmuebles")
    .select(
      "id, referencia, direccion, zona_id, propietario_id, precio, metros_cuadrados, habitaciones, banos, tipo, estado, certificado_energetico, descripcion, fecha_publicacion, creado_en, agente_id, zonas(nombre, ciudad)"
    )
    .eq("tenant_id", usuario.tenant_id);

  const params = await searchParams;
  if (params.estado) query = query.eq("estado", params.estado);
  if (params.tipo) query = query.eq("tipo", params.tipo);
  if (params.precio_min) query = query.gte("precio", Number(params.precio_min));
  if (params.precio_max) query = query.lte("precio", Number(params.precio_max));

  const { data } = await query.order("creado_en", { ascending: false });
  const base = data ?? [];
  const ids = base.map((i) => i.id);

  const [{ data: documentos }, { data: visitas }, { data: agentes }] = await Promise.all([
    ids.length
      ? supabase
          .from("documentos")
          .select("entidad_id, tipo_documento, url_storage, creado_en")
          .eq("entidad_tipo", "inmueble")
          .in("entidad_id", ids)
          .order("creado_en", { ascending: false })
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("eventos_agenda")
          .select("entidad_id")
          .eq("entidad_tipo", "inmueble")
          .eq("tipo", "visita")
          .in("entidad_id", ids)
      : Promise.resolve({ data: [] }),
    supabase
      .from("usuarios")
      .select("id, nombre_completo")
      .eq("tenant_id", usuario.tenant_id)
      .eq("activo", true),
  ]);

  const fotoPorInmueble = new Map<string, string>();
  const tieneDocumentoPorInmueble = new Set<string>();
  for (const d of documentos ?? []) {
    tieneDocumentoPorInmueble.add(d.entidad_id);
    if (d.tipo_documento === "foto" && !fotoPorInmueble.has(d.entidad_id)) {
      fotoPorInmueble.set(d.entidad_id, d.url_storage);
    }
  }

  const visitasPorInmueble = new Map<string, number>();
  for (const v of visitas ?? []) {
    visitasPorInmueble.set(v.entidad_id, (visitasPorInmueble.get(v.entidad_id) ?? 0) + 1);
  }

  const agentesPorId = new Map((agentes ?? []).map((a) => [a.id, a.nombre_completo as string]));

  const inmuebles = base.map((i) => {
    const zona = Array.isArray(i.zonas) ? i.zonas[0] : i.zonas;
    return {
      ...i,
      foto: fotoPorInmueble.get(i.id) ?? null,
      visitas: visitasPorInmueble.get(i.id) ?? 0,
      poblacion: zona?.ciudad ?? zona?.nombre ?? null,
    };
  }) as InmuebleConAgente[];

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const kpis = [
    {
      label: "Activos",
      valor: inmuebles.filter((i) => i.estado !== "vendido").length,
      icono: Home,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Nuevos",
      valor: inmuebles.filter((i) => new Date(i.creado_en) >= inicioMes).length,
      icono: Sparkles,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Vendidos",
      valor: inmuebles.filter((i) => i.estado === "vendido").length,
      icono: Award,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Reservados",
      valor: inmuebles.filter((i) => i.estado === "reservado").length,
      icono: BookmarkCheck,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Sin fotos",
      valor: inmuebles.filter((i) => !fotoPorInmueble.has(i.id)).length,
      icono: ImageOff,
      color: "bg-rose-500/10 text-rose-600",
    },
    {
      label: "Sin documentación",
      valor: inmuebles.filter((i) => !tieneDocumentoPorInmueble.has(i.id)).length,
      icono: FileWarning,
      color: "bg-orange-500/10 text-orange-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Inmuebles</h1>
        {gestor && <NuevoInmueble />}
      </div>

      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {kpis.map(({ label, valor, icono: Icono, color }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border p-3">
            <span className={`flex size-8 items-center justify-center rounded-lg ${color}`}>
              <Icono className="size-4" />
            </span>
            <span className="text-xl font-semibold">{valor}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <Filtros />

      {inmuebles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay inmuebles registrados.</p>
      ) : (
        <Tabla inmuebles={inmuebles} agentesPorId={agentesPorId} gestor={gestor} />
      )}
    </div>
  );
}
