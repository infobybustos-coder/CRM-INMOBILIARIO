import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NuevaOfertaForm } from "./nueva-oferta-form";
import { TarjetaOferta } from "./tarjeta-oferta";
import { HandshakeIcon, Plus } from "lucide-react";

const COLUMNAS = [
  { estado: "pendiente", label: "Pendiente", color: "border-amber-400 bg-amber-50 dark:bg-amber-950/20" },
  { estado: "negociacion", label: "Negociación", color: "border-blue-400 bg-blue-50 dark:bg-blue-950/20" },
  { estado: "contraoferta", label: "Contraoferta", color: "border-violet-400 bg-violet-50 dark:bg-violet-950/20" },
  { estado: "aceptada", label: "Aceptada", color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" },
  { estado: "rechazada", label: "Rechazada", color: "border-red-300 bg-red-50 dark:bg-red-950/20" },
] as const;

export default async function OfertasPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();

  let query = supabase
    .from("ofertas")
    .select("id, inmueble_id, comprador_id, agente_id, importe, estado, nota, contraoferta_importe, contraoferta_nota, creado_en, actualizado_en")
    .eq("tenant_id", usuario.tenant_id)
    .order("actualizado_en", { ascending: false });

  if (!gestor) query = query.eq("agente_id", usuario.id);

  const { data } = await query;
  const ofertas = data ?? [];

  // Load related entity names
  const inmuebleIds = [...new Set(ofertas.map(o => o.inmueble_id).filter(Boolean))];
  const compradorIds = [...new Set(ofertas.map(o => o.comprador_id).filter(Boolean))];

  const [{ data: inmuebles }, { data: compradores }, { data: misInmuebles }, { data: misCompradores }] =
    await Promise.all([
      inmuebleIds.length
        ? supabase.from("inmuebles").select("id, direccion, precio").in("id", inmuebleIds)
        : Promise.resolve({ data: [] }),
      compradorIds.length
        ? supabase.from("compradores").select("id, nombre").in("id", compradorIds)
        : Promise.resolve({ data: [] }),
      // For the form dropdowns
      supabase.from("inmuebles").select("id, direccion").eq("tenant_id", usuario.tenant_id).limit(50),
      supabase.from("compradores").select("id, nombre").eq("tenant_id", usuario.tenant_id).limit(50),
    ]);

  const nombreInmueble = new Map((inmuebles ?? []).map(i => [i.id, { direccion: i.direccion, precio: i.precio }]));
  const nombreComprador = new Map((compradores ?? []).map(c => [c.id, c.nombre]));

  const porEstado = (estado: string) => ofertas.filter(o => o.estado === estado);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ofertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seguimiento de negociaciones y contraofertas
          </p>
        </div>
        <NuevaOfertaForm
          inmuebles={misInmuebles ?? []}
          compradores={misCompradores ?? []}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {COLUMNAS.map(({ estado, label, color }) => (
          <div key={estado} className={`rounded-xl border-l-4 p-3 ${color}`}>
            <p className="text-xl font-bold">{porEstado(estado).length}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Kanban */}
      {ofertas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <HandshakeIcon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">No hay ofertas registradas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra tu primera oferta cuando un comprador muestre interés.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {COLUMNAS.map(({ estado, label, color }) => {
            const items = porEstado(estado);
            return (
              <div key={estado} className="space-y-2">
                <div className={`rounded-lg border-l-4 px-3 py-2 ${color}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    {label} · {items.length}
                  </p>
                </div>
                {items.map((oferta) => (
                  <TarjetaOferta
                    key={oferta.id}
                    oferta={oferta}
                    inmueble={oferta.inmueble_id ? (nombreInmueble.get(oferta.inmueble_id) ?? null) : null}
                    compradorNombre={oferta.comprador_id ? (nombreComprador.get(oferta.comprador_id) ?? null) : null}
                  />
                ))}
                {items.length === 0 && (
                  <p className="px-2 text-xs text-muted-foreground/60">Sin ofertas</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
