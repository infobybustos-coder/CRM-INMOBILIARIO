import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NuevaVentaForm } from "./nueva-venta-form";
import { TarjetaVenta } from "./tarjeta-venta";
import { TrendingUp, Euro, CheckCircle2, Clock } from "lucide-react";

const ETAPAS = [
  {
    estado: "reserva",
    label: "Reserva",
    paso: 1,
    color: "border-amber-400 bg-amber-50 dark:bg-amber-950/20",
    dot: "bg-amber-400",
  },
  {
    estado: "documentacion",
    label: "Documentación",
    paso: 2,
    color: "border-blue-400 bg-blue-50 dark:bg-blue-950/20",
    dot: "bg-blue-400",
  },
  {
    estado: "firma",
    label: "Firma",
    paso: 3,
    color: "border-violet-400 bg-violet-50 dark:bg-violet-950/20",
    dot: "bg-violet-400",
  },
  {
    estado: "completada",
    label: "Completada",
    paso: 4,
    color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
    dot: "bg-emerald-400",
  },
] as const;

export default async function VentasPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();

  let query = supabase
    .from("ventas")
    .select("id, inmueble_id, comprador_id, agente_id, precio_venta, comision_porcentaje, comision_importe, estado, fecha_reserva, fecha_documentacion, fecha_firma, notas, creado_en")
    .eq("tenant_id", usuario.tenant_id)
    .order("creado_en", { ascending: false });

  if (!gestor) query = query.eq("agente_id", usuario.id);

  const { data } = await query;
  const ventas = data ?? [];

  const inmuebleIds = [...new Set(ventas.map(v => v.inmueble_id).filter(Boolean))];
  const compradorIds = [...new Set(ventas.map(v => v.comprador_id).filter(Boolean))];

  const [{ data: inmuebles }, { data: compradores }, { data: misInmuebles }, { data: misCompradores }] =
    await Promise.all([
      inmuebleIds.length
        ? supabase.from("inmuebles").select("id, direccion, precio").in("id", inmuebleIds)
        : Promise.resolve({ data: [] }),
      compradorIds.length
        ? supabase.from("compradores").select("id, nombre").in("id", compradorIds)
        : Promise.resolve({ data: [] }),
      supabase.from("inmuebles").select("id, direccion").eq("tenant_id", usuario.tenant_id).limit(50),
      supabase.from("compradores").select("id, nombre").eq("tenant_id", usuario.tenant_id).limit(50),
    ]);

  const datosInmueble = new Map((inmuebles ?? []).map(i => [i.id, i]));
  const nombreComprador = new Map((compradores ?? []).map(c => [c.id, c.nombre]));

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const totalComisiones = ventas
    .filter(v => v.estado === "completada" && v.comision_importe)
    .reduce((sum, v) => sum + (v.comision_importe ?? 0), 0);

  const enCurso = ventas.filter(v => v.estado !== "completada").length;
  const completadas = ventas.filter(v => v.estado === "completada").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ventas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline: Reserva → Documentación → Firma → Completada
          </p>
        </div>
        <NuevaVentaForm
          inmuebles={misInmuebles ?? []}
          compradores={misCompradores ?? []}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total operaciones", value: ventas.length, icon: TrendingUp, color: "text-primary" },
          { label: "En proceso", value: enCurso, icon: Clock, color: "text-amber-500" },
          { label: "Completadas", value: completadas, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Comisiones generadas", value: fmt(totalComisiones), icon: Euro, color: "text-blue-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <Icon className={`mb-2 size-5 ${color}`} />
            <p className="text-xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      {ventas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <TrendingUp className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">No hay ventas en curso</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando un comprador acepte una oferta, registra la venta aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPAS.map((etapa) => {
            const items = ventas.filter(v => v.estado === etapa.estado);
            return (
              <div key={etapa.estado} className="space-y-2">
                <div className={`rounded-lg border-l-4 px-3 py-2 ${etapa.color}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-foreground shadow-sm dark:bg-card">
                      {etapa.paso}
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      {etapa.label} · {items.length}
                    </p>
                  </div>
                </div>
                {items.map((venta) => (
                  <TarjetaVenta
                    key={venta.id}
                    venta={venta}
                    inmueble={venta.inmueble_id ? (datosInmueble.get(venta.inmueble_id) ?? null) : null}
                    compradorNombre={venta.comprador_id ? (nombreComprador.get(venta.comprador_id) ?? null) : null}
                    etapas={ETAPAS}
                  />
                ))}
                {items.length === 0 && (
                  <p className="px-2 text-xs text-muted-foreground/60">Sin operaciones</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
