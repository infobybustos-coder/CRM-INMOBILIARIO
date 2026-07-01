import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TarjetaAgente } from "./tarjeta-agente";
import { Trophy, UserPlus, Sparkles, TrendingUp, Home, Users, UserSearch } from "lucide-react";

const PRECIO_AGENTE_EXTRA = 7.99;
const AGENTES_INCLUIDOS = 2;

export default async function AgentesPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (!esGestor(usuario.rol)) redirect("/inmobiliaria");

  const supabase = await createClient();

  // Load team members (agents + captadores)
  const { data: miembros } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email, rol, activo, avatar_url")
    .eq("tenant_id", usuario.tenant_id)
    .in("rol", ["agente", "captador", "administrador", "director_comercial"])
    .order("creado_en");

  const todos = miembros ?? [];
  const ids = todos.map((m) => m.id);

  // Load stats in parallel
  const [{ data: inmuebles }, { data: propietarios }, { data: compradores }] =
    await Promise.all([
      ids.length
        ? supabase
            .from("inmuebles")
            .select("agente_id, estado")
            .in("agente_id", ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("propietarios")
            .select("agente_id, estado")
            .in("agente_id", ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from("compradores")
            .select("agente_id, estado")
            .in("agente_id", ids)
        : Promise.resolve({ data: [] }),
    ]);

  // Build stats map per agent
  type Stats = {
    inmuebles: number;
    inmuebles_vendidos: number;
    propietarios: number;
    propietarios_firmados: number;
    compradores: number;
    compradores_comprado: number;
    total: number;
    puntos: number;
  };

  const statsMap = new Map<string, Stats>();
  for (const m of todos) {
    statsMap.set(m.id, {
      inmuebles: 0,
      inmuebles_vendidos: 0,
      propietarios: 0,
      propietarios_firmados: 0,
      compradores: 0,
      compradores_comprado: 0,
      total: 0,
      puntos: 0,
    });
  }

  for (const i of inmuebles ?? []) {
    if (!i.agente_id) continue;
    const s = statsMap.get(i.agente_id);
    if (!s) continue;
    s.inmuebles++;
    if (i.estado === "vendido" || i.estado === "alquilado") s.inmuebles_vendidos++;
  }
  for (const p of propietarios ?? []) {
    if (!p.agente_id) continue;
    const s = statsMap.get(p.agente_id);
    if (!s) continue;
    s.propietarios++;
    if (p.estado === "firmado") s.propietarios_firmados++;
  }
  for (const c of compradores ?? []) {
    if (!c.agente_id) continue;
    const s = statsMap.get(c.agente_id);
    if (!s) continue;
    s.compradores++;
    if (c.estado === "comprado") s.compradores_comprado++;
  }

  // Score: closed operations × 10, active assignments × 1
  for (const [, s] of statsMap) {
    s.total = s.inmuebles + s.propietarios + s.compradores;
    s.puntos =
      (s.inmuebles_vendidos + s.propietarios_firmados + s.compradores_comprado) * 10 +
      s.total;
  }

  // Sort by puntos desc
  const agentesConStats = todos
    .map((m) => ({ ...m, stats: statsMap.get(m.id)! }))
    .sort((a, b) => b.stats.puntos - a.stats.puntos);

  const agentesActivos = todos.filter(
    (m) => m.activo && (m.rol === "agente" || m.rol === "captador")
  ).length;

  const agentesExtra = Math.max(0, agentesActivos - AGENTES_INCLUIDOS);
  const costoMensual = agentesExtra * PRECIO_AGENTE_EXTRA;

  // Summary stats across all agents
  const totalInmuebles = [...statsMap.values()].reduce((a, s) => a + s.inmuebles, 0);
  const totalPropietarios = [...statsMap.values()].reduce((a, s) => a + s.propietarios, 0);
  const totalCompradores = [...statsMap.values()].reduce((a, s) => a + s.compradores, 0);
  const totalCerrados = [...statsMap.values()].reduce(
    (a, s) => a + s.inmuebles_vendidos + s.propietarios_firmados + s.compradores_comprado,
    0
  );

  const top3 = agentesConStats.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rendimiento del equipo y gestión de asignaciones
          </p>
        </div>
        <Link
          href="/inmobiliaria/equipo"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <UserPlus className="size-4" />
          Invitar agente
        </Link>
      </div>

      {/* Plan upsell */}
      {agentesActivos <= AGENTES_INCLUIDOS ? (
        <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Plan actual: {AGENTES_INCLUIDOS} agentes incluidos gratis
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Tienes {agentesActivos} de {AGENTES_INCLUIDOS} agentes activos.{" "}
              Añade más cuando lo necesites por solo{" "}
              <strong>{PRECIO_AGENTE_EXTRA.toFixed(2).replace(".", ",")}€/mes</strong> cada uno.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800/40 dark:bg-blue-950/20">
          <TrendingUp className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="flex-1 space-y-0.5">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Equipo activo: {agentesActivos} agentes
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {AGENTES_INCLUIDOS} incluidos en tu plan +{" "}
              <strong>{agentesExtra} adicionales × {PRECIO_AGENTE_EXTRA.toFixed(2).replace(".", ",")}€/mes</strong>
              {" = "}
              <strong>{costoMensual.toFixed(2).replace(".", ",")}€/mes</strong>
            </p>
          </div>
        </div>
      )}

      {/* Global stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Inmuebles activos", value: totalInmuebles, icon: Home, color: "text-blue-600 dark:text-blue-400" },
          { label: "Captaciones", value: totalPropietarios, icon: Users, color: "text-violet-600 dark:text-violet-400" },
          { label: "Compradores", value: totalCompradores, icon: UserSearch, color: "text-sky-600 dark:text-sky-400" },
          { label: "Operaciones cerradas", value: totalCerrados, icon: Trophy, color: "text-amber-600 dark:text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className={`mb-2 ${color}`}>
              <Icon className="size-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Ranking podium top 3 */}
      {top3.length > 0 && top3[0].stats.puntos > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Ranking del mes</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {top3.map((agente, idx) => {
              const medallas = ["🥇", "🥈", "🥉"];
              const colores = [
                "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-700/50",
                "border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-800/20 dark:border-slate-600/50",
                "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 dark:border-orange-700/50",
              ];
              return (
                <div
                  key={agente.id}
                  className={`rounded-xl border-2 p-4 ${colores[idx] ?? "border-border bg-card"}`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-2xl">{medallas[idx]}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{agente.nombre_completo ?? agente.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {agente.rol.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{agente.stats.inmuebles}</p>
                      <p className="text-[10px] text-muted-foreground">Inmuebles</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{agente.stats.propietarios}</p>
                      <p className="text-[10px] text-muted-foreground">Captaciones</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{agente.stats.compradores}</p>
                      <p className="text-[10px] text-muted-foreground">Compradores</p>
                    </div>
                  </div>
                  <div className="mt-3 border-t pt-2 text-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {agente.stats.puntos} pts ·{" "}
                      {agente.stats.inmuebles_vendidos +
                        agente.stats.propietarios_firmados +
                        agente.stats.compradores_comprado}{" "}
                      operaciones cerradas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full agent list */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Todo el equipo</h2>
        {agentesConStats.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <UserPlus className="mx-auto mb-3 size-8 text-muted-foreground/50" />
            <p className="font-medium">Aún no hay agentes en tu equipo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Invita a tu primer agente desde la sección Equipo.
            </p>
            <Link
              href="/inmobiliaria/equipo"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <UserPlus className="size-4" />
              Invitar agente
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agentesConStats.map((agente, idx) => (
              <TarjetaAgente
                key={agente.id}
                agente={agente}
                stats={agente.stats}
                posicion={idx + 1}
                esMiMismoId={agente.id === usuario.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Why it matters */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="font-semibold">¿Por qué tener todo en un mismo lugar?</h2>
        </div>
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          {[
            {
              titulo: "Sin llamadas de seguimiento perdidas",
              desc: "Cada agente ve sus leads asignados al instante. Ningún cliente queda sin atender.",
            },
            {
              titulo: "Rendimiento en tiempo real",
              desc: "Identifica quién necesita apoyo y quién está cerrando más para replicar su método.",
            },
            {
              titulo: "Menos reuniones de coordinación",
              desc: "El equipo trabaja de forma autónoma con toda la info centralizada. Tú delegas con confianza.",
            },
          ].map(({ titulo, desc }) => (
            <div key={titulo}>
              <p className="font-semibold text-foreground">{titulo}</p>
              <p className="mt-1 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
