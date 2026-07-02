import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BarChart2, TrendingUp, Users, Home, UserSearch } from "lucide-react";

export default async function RendimientoPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (!esGestor(usuario.rol)) redirect("/inmobiliaria");

  const supabase = await createClient();

  const [{ data: agentes }, { data: propietarios }, { data: inmuebles }, { data: compradores }] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select("id, nombre_completo")
        .eq("tenant_id", usuario.tenant_id)
        .eq("activo", true)
        .order("nombre_completo"),
      supabase
        .from("propietarios")
        .select("id, agente_id, estado, creado_en")
        .eq("tenant_id", usuario.tenant_id),
      supabase
        .from("inmuebles")
        .select("id, agente_id, estado, creado_en")
        .eq("tenant_id", usuario.tenant_id),
      supabase
        .from("compradores")
        .select("id, agente_id, estado, creado_en")
        .eq("tenant_id", usuario.tenant_id),
    ]);

  const ranking = (agentes ?? []).map((a) => {
    const props = (propietarios ?? []).filter((p) => p.agente_id === a.id);
    const inms = (inmuebles ?? []).filter((i) => i.agente_id === a.id);
    const comps = (compradores ?? []).filter((c) => c.agente_id === a.id);
    const exclusivas = props.filter((p) => p.estado === "exclusiva_firmada" || p.estado === "captado").length;
    const vendidos = inms.filter((i) => i.estado === "vendido").length;
    const puntos = exclusivas * 10 + vendidos * 15 + props.length;
    return {
      id: a.id,
      nombre: a.nombre_completo,
      propietarios: props.length,
      exclusivas,
      inmuebles: inms.length,
      vendidos,
      compradores: comps.length,
      puntos,
    };
  }).sort((a, b) => b.puntos - a.puntos);

  const MEDALLA = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rendimiento del equipo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Métricas y ranking por agente
        </p>
      </div>

      {ranking.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <BarChart2 className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">Sin datos de equipo aún</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Añade agentes desde la sección Usuarios para ver el rendimiento.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Agente</th>
                <th className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-1"><Users className="size-3" /> Captaciones</span>
                </th>
                <th className="px-4 py-3 text-right">Exclusivas</th>
                <th className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-1"><Home className="size-3" /> Inmuebles</span>
                </th>
                <th className="px-4 py-3 text-right">Vendidos</th>
                <th className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-1"><UserSearch className="size-3" /> Compradores</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-1"><TrendingUp className="size-3" /> Puntos</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ranking.map((a, i) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-lg">
                    {MEDALLA[i] ?? <span className="text-sm text-muted-foreground">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium">{a.nombre}</td>
                  <td className="px-4 py-3 text-right">{a.propietarios}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{a.exclusivas}</td>
                  <td className="px-4 py-3 text-right">{a.inmuebles}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{a.vendidos}</td>
                  <td className="px-4 py-3 text-right">{a.compradores}</td>
                  <td className="px-4 py-3 text-right font-bold">{a.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
