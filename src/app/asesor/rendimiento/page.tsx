import { redirect } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PROPIETARIO } from "../propietarios/constantes";

function BarraProgreso({ label, actual, objetivo }: { label: string; actual: number; objetivo: number }) {
  const pct = Math.min(100, Math.round((actual / Math.max(1, objetivo)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">
          {actual} / {objetivo}
        </p>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function RendimientoPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    seguimientosHoy,
    llamadasHoy,
    visitasHoy,
    captacionesHoy,
    captacionesMes,
    exclusivasMes,
    propietariosFunnel,
    inmueblesVendidos,
  ] = await Promise.all([
    supabase
      .from("actividades")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuario.id)
      .in("entidad_tipo", ["propietario", "comprador"])
      .gte("creado_en", inicioHoy.toISOString())
      .lte("creado_en", finHoy.toISOString()),
    supabase
      .from("eventos_agenda")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuario.id)
      .eq("tipo", "llamada")
      .eq("estado", "completado")
      .gte("fecha_hora", inicioHoy.toISOString())
      .lte("fecha_hora", finHoy.toISOString()),
    supabase
      .from("eventos_agenda")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuario.id)
      .eq("tipo", "visita")
      .eq("estado", "completado")
      .gte("fecha_hora", inicioHoy.toISOString())
      .lte("fecha_hora", finHoy.toISOString()),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .gte("creado_en", inicioHoy.toISOString())
      .lte("creado_en", finHoy.toISOString()),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .gte("creado_en", inicioMes.toISOString()),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .eq("estado", "exclusiva_firmada")
      .gte("actualizado_en", inicioMes.toISOString()),
    supabase.from("propietarios").select("estado").eq("agente_id", usuario.id),
    supabase
      .from("inmuebles")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", usuario.id)
      .eq("estado", "vendido"),
  ]);

  const objetivoCaptaciones = 10;
  const objetivoExclusivas = usuario.tenant?.objetivo_exclusivas_mensual ?? 10;

  const ordenEstado = ESTADOS_PROPIETARIO.reduce<Record<string, number>>((acc, e, i) => {
    acc[e] = i;
    return acc;
  }, {});
  const listaFunnel = (propietariosFunnel.data ?? []).filter((p) => p.estado !== "perdido");
  const totalPropietarios = listaFunnel.length;
  const totalTasaciones = listaFunnel.filter((p) => ordenEstado[p.estado] >= ordenEstado["tasacion_programada"]).length;
  const totalExclusivas = listaFunnel.filter((p) => ordenEstado[p.estado] >= ordenEstado["exclusiva_firmada"]).length;
  const totalVendidos = inmueblesVendidos.count ?? 0;

  const funnel = [
    { label: "Propietarios", valor: totalPropietarios },
    { label: "Tasaciones", valor: totalTasaciones },
    { label: "Exclusivas", valor: totalExclusivas },
    { label: "Vendidos", valor: totalVendidos },
  ];

  const hoyStats = [
    { label: "Seguimientos realizados", valor: seguimientosHoy.count ?? 0 },
    { label: "Llamadas", valor: llamadasHoy.count ?? 0 },
    { label: "Visitas", valor: visitasHoy.count ?? 0 },
    { label: "Captaciones", valor: captacionesHoy.count ?? 0 },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Rendimiento</h1>
        <p className="mt-1 text-muted-foreground">Tu actividad y resultados, no los del equipo.</p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Hoy</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hoyStats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-semibold">{s.valor}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Este mes</h2>
        <div className="mt-3 space-y-4">
          <BarraProgreso label="Captaciones" actual={captacionesMes.count ?? 0} objetivo={objetivoCaptaciones} />
          <BarraProgreso label="Exclusivas" actual={exclusivasMes.count ?? 0} objetivo={objetivoExclusivas} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Conversión</h2>
        <div className="mt-3 space-y-1">
          {funnel.map((f, i) => (
            <div key={f.label}>
              <div className="flex items-center justify-between rounded-md px-1 py-1.5">
                <span className="text-sm text-muted-foreground">{f.label}</span>
                <span className="text-lg font-semibold">{f.valor}</span>
              </div>
              {i < funnel.length - 1 && (
                <div className="flex justify-center text-muted-foreground/50">
                  <ArrowDown className="size-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
