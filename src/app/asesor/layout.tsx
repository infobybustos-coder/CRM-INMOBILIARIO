import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";
import { AsesorNav } from "@/components/asesor/nav";
import { QuickAdd } from "@/components/asesor/quick-add";
import { ThemeToggle } from "@/components/asesor/theme-toggle";
import { UserMenu } from "@/components/asesor/user-menu";
import { PreferenciasProvider } from "@/lib/preferencias";

export default async function AsesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();

  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");

  const supabase = await createClient();
  const avatarUrl = usuario.avatar_url
    ? supabase.storage.from("avatares").getPublicUrl(usuario.avatar_url).data.publicUrl
    : null;

  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const { count: tareasNotificacion } = await supabase
    .from("tareas")
    .select("id", { count: "exact", head: true })
    .eq("asignado_a", usuario.id)
    .eq("estado", "pendiente")
    .not("fecha_vencimiento", "is", null)
    .lte("fecha_vencimiento", finHoy.toISOString());

  return (
    <PreferenciasProvider
      inicial={{
        moneda: (usuario.moneda as "EUR" | "USD") ?? "EUR",
        idioma: (usuario.idioma as "es" | "en") ?? "es",
      }}
    >
      <div className="tema-asesor min-h-screen bg-background text-foreground md:pl-(--nav-ancho)">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold">{usuario.tenant?.nombre}</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu
              nombre={usuario.nombre_completo ?? usuario.email}
              avatarUrl={avatarUrl}
              cerrarSesionAction={signOut}
            />
          </div>
        </header>
        <main className="p-4 pb-24 md:pb-6">{children}</main>
        <AsesorNav tareasNotificacion={tareasNotificacion ?? 0} />
        <QuickAdd />
      </div>
    </PreferenciasProvider>
  );
}
