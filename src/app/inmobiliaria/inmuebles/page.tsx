import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Filtros } from "@/components/asesor/inmuebles/filtros";
import { VerComoSwitcher } from "@/components/inmobiliaria/ver-como-switcher";
import { Tabla } from "@/components/asesor/inmuebles/tabla";
import type { Inmueble } from "@/app/asesor/inmuebles/constantes";

const BASE = "/inmobiliaria/inmuebles";

export default async function InmobiliariaInmueblesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const params = await searchParams;
  const verComo = esGestor(usuario.rol) && params.ver_como ? params.ver_como : usuario.rol;

  if (usuario.rol === "captador" || verComo === "captador") redirect("/inmobiliaria/propietarios");

  const filtrarPorAgente = verComo === "agente";

  const supabase = await createClient();
  let query = supabase
    .from("inmuebles")
    .select(
      "id, referencia, direccion, zona_id, propietario_id, precio, metros_cuadrados, habitaciones, banos, tipo, estado, certificado_energetico, descripcion, fecha_publicacion, creado_en, zonas(nombre, ciudad)"
    );

  if (filtrarPorAgente) query = query.eq("agente_id", usuario.id);
  if (params.estado) query = query.eq("estado", params.estado);
  if (params.tipo) query = query.eq("tipo", params.tipo);
  if (params.precio_min) query = query.gte("precio", Number(params.precio_min));
  if (params.precio_max) query = query.lte("precio", Number(params.precio_max));

  const { data } = await query.order("creado_en", { ascending: false });
  const base = data ?? [];
  const ids = base.map((i) => i.id);

  const [{ data: fotos }, { data: visitas }] = await Promise.all([
    ids.length
      ? supabase
          .from("documentos")
          .select("entidad_id, url_storage, creado_en")
          .eq("entidad_tipo", "inmueble")
          .eq("tipo_documento", "foto")
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
  ]);

  const fotoPorInmueble = new Map<string, string>();
  for (const f of fotos ?? []) {
    if (!fotoPorInmueble.has(f.entidad_id)) fotoPorInmueble.set(f.entidad_id, f.url_storage);
  }

  const visitasPorInmueble = new Map<string, number>();
  for (const v of visitas ?? []) {
    visitasPorInmueble.set(v.entidad_id, (visitasPorInmueble.get(v.entidad_id) ?? 0) + 1);
  }

  const inmuebles = base.map((i) => {
    const zona = Array.isArray(i.zonas) ? i.zonas[0] : i.zonas;
    return {
      ...i,
      foto: fotoPorInmueble.get(i.id) ?? null,
      visitas: visitasPorInmueble.get(i.id) ?? 0,
      poblacion: zona?.ciudad ?? zona?.nombre ?? null,
    };
  }) as Inmueble[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inmuebles</h1>

      {esGestor(usuario.rol) && <VerComoSwitcher rolActual={usuario.rol} />}

      <Filtros />

      {inmuebles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay inmuebles registrados en este tenant todavía.
        </p>
      ) : (
        <Tabla inmuebles={inmuebles} basePath={BASE} />
      )}
    </div>
  );
}
