import { redirect } from "next/navigation";
import Link from "next/link";
import { Target, ArrowRight, ShieldAlert } from "lucide-react";
import { getUsuarioConTenant, enImpersonacionSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { calcularCaptacionScore, calcularCompraScore, calcularPrioridad, calcularPrioridadComprador } from "@/lib/prioridad";
import { signOut } from "../(auth)/actions";
import { salirDeImpersonacion } from "../superadmin/clientes/impersonar-actions";
import { AsesorNav } from "@/components/asesor/nav";
import { QuickAdd } from "@/components/asesor/quick-add";
import { ThemeToggle } from "@/components/asesor/theme-toggle";
import { UserMenu } from "@/components/asesor/user-menu";
import { PreferenciasProvider } from "@/lib/preferencias";

const RUTA_ENTIDAD: Record<string, string> = {
  propietario: "/asesor/propietarios",
  comprador: "/asesor/compradores",
  inmueble: "/asesor/inmuebles",
};

export default async function AsesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();
  const soporteActivo = await enImpersonacionSuperadmin();

  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");

  const supabase = await createClient();
  const avatarUrl = usuario.avatar_url
    ? supabase.storage.from("avatares").getPublicUrl(usuario.avatar_url).data.publicUrl
    : null;

  const ahora = new Date();
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);

  const [
    { count: tareasHoy },
    { count: eventosHoy },
    { data: tareasVencidas },
    { data: eventosVencidos },
    { data: propietariosAlta },
    { data: compradoresAlta },
  ] = await Promise.all([
    supabase
      .from("tareas")
      .select("id", { count: "exact", head: true })
      .eq("asignado_a", usuario.id)
      .eq("estado", "pendiente")
      .not("fecha_vencimiento", "is", null)
      .lte("fecha_vencimiento", finHoy.toISOString()),
    supabase
      .from("eventos_agenda")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", usuario.id)
      .eq("estado", "pendiente")
      .lte("fecha_hora", finHoy.toISOString()),
    supabase
      .from("tareas")
      .select("id, entidad_tipo, entidad_id, fecha_vencimiento")
      .eq("asignado_a", usuario.id)
      .eq("estado", "pendiente")
      .not("fecha_vencimiento", "is", null)
      .lt("fecha_vencimiento", ahora.toISOString())
      .order("fecha_vencimiento", { ascending: true })
      .limit(5),
    supabase
      .from("eventos_agenda")
      .select("id, entidad_tipo, entidad_id, fecha_hora")
      .eq("usuario_id", usuario.id)
      .eq("estado", "pendiente")
      .lt("fecha_hora", ahora.toISOString())
      .order("fecha_hora", { ascending: true })
      .limit(5),
    supabase
      .from("propietarios")
      .select("id, estado, fecha_ultimo_contacto, fecha_proxima_accion, valor_estimado, fuente_lead")
      .eq("agente_id", usuario.id)
      .not("estado", "in", "(captado,perdido)"),
    supabase
      .from("compradores")
      .select("id, estado, fecha_ultimo_contacto, fecha_proxima_accion, urgencia, presupuesto_max")
      .eq("agente_id", usuario.id)
      .not("estado", "in", "(comprado,perdido)"),
  ]);

  // --- Mi foco de hoy: qué es lo único más urgente ahora mismo ------------
  const propietariosUrgentes = (propietariosAlta ?? []).filter((p) => calcularPrioridad(p) === "alta");
  const compradoresUrgentes = (compradoresAlta ?? []).filter((c) => calcularPrioridadComprador(c) === "alta");

  const focoCount =
    (tareasVencidas?.length ?? 0) +
    (eventosVencidos?.length ?? 0) +
    propietariosUrgentes.length +
    compradoresUrgentes.length;

  let focoHref: string | null = null;
  if (tareasVencidas && tareasVencidas.length > 0) {
    const t = tareasVencidas[0];
    focoHref = t.entidad_tipo && t.entidad_id ? `${RUTA_ENTIDAD[t.entidad_tipo]}/${t.entidad_id}` : "/asesor/seguimiento";
  } else if (eventosVencidos && eventosVencidos.length > 0) {
    const e = eventosVencidos[0];
    focoHref = e.entidad_tipo && e.entidad_id ? `${RUTA_ENTIDAD[e.entidad_tipo]}/${e.entidad_id}` : "/asesor/seguimiento";
  } else if (propietariosUrgentes.length > 0) {
    const top = [...propietariosUrgentes].sort((a, b) => calcularCaptacionScore(b) - calcularCaptacionScore(a))[0];
    focoHref = `/asesor/propietarios/${top.id}`;
  } else if (compradoresUrgentes.length > 0) {
    const top = [...compradoresUrgentes].sort((a, b) => calcularCompraScore(b) - calcularCompraScore(a))[0];
    focoHref = `/asesor/compradores/${top.id}`;
  }

  const avisos = {
    "/asesor/seguimiento": (tareasHoy ?? 0) > 0 || (eventosHoy ?? 0) > 0,
  };

  return (
    <PreferenciasProvider inicial={{ moneda: "EUR", idioma: "es" }}>
      <div className="tema-asesor min-h-screen bg-background text-foreground md:pl-(--nav-ancho)">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold">{usuario.tenant?.nombre}</span>
          <div className="flex items-center gap-2">
            {focoHref && focoCount > 0 && (
              <Link
                href={focoHref}
                className="hidden items-center gap-1.5 rounded-full border bg-primary/5 px-3 py-1.5 text-xs transition-colors hover:bg-primary/10 sm:flex"
              >
                <Target className="size-3.5 text-primary" />
                <span className="font-medium">
                  {focoCount} {focoCount === 1 ? "pendiente" : "pendientes"}
                </span>
                <span className="flex items-center gap-0.5 font-medium text-primary">
                  Comenzar <ArrowRight className="size-3" />
                </span>
              </Link>
            )}
            <ThemeToggle />
            <UserMenu
              nombre={usuario.nombre_completo ?? usuario.email}
              avatarUrl={avatarUrl}
              cerrarSesionAction={signOut}
            />
          </div>
        </header>
        {soporteActivo && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="size-4" /> Sesión de soporte: has accedido como{" "}
              {usuario.nombre_completo ?? usuario.email}
            </span>
            <form action={salirDeImpersonacion}>
              <button type="submit" className="font-medium underline underline-offset-2">
                Salir y volver a Superadmin
              </button>
            </form>
          </div>
        )}
        <main className="p-4 pb-24 md:pb-6">{children}</main>
        <AsesorNav avisos={avisos} />
        <QuickAdd />
      </div>
    </PreferenciasProvider>
  );
}
