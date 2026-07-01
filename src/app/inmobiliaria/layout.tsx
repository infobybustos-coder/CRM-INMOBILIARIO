import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { signOut } from "../(auth)/actions";
import { InmobiliariaNav } from "@/components/inmobiliaria/nav";
import { ThemeToggle } from "@/components/asesor/theme-toggle";
import { UserMenu } from "@/components/asesor/user-menu";
import { createClient } from "@/lib/supabase/server";
import { desactivarVistaPrevia } from "./equipo/ver-como-actions";

const ETIQUETAS_ROL: Record<string, string> = {
  administrador: "Administrador",
  director_comercial: "Administrador",
  agente: "Agente Inmobiliario",
  captador: "Agente Inmobiliario",
};

export default async function InmobiliariaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();

  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "inmobiliaria") redirect("/asesor");

  const jar = await cookies();
  const verComo = esGestor(usuario.rol) ? (jar.get("inmobiliaria_ver_como")?.value ?? null) : null;
  const rolEfectivo = verComo ?? usuario.rol;

  const gestor = esGestor(rolEfectivo);

  const supabase = await createClient();
  const avatarUrl = usuario.avatar_url
    ? supabase.storage.from("avatares").getPublicUrl(usuario.avatar_url).data.publicUrl
    : null;

  return (
    <div className="layout-inmobiliaria min-h-screen bg-background text-foreground md:pl-[var(--nav-ancho,14rem)] [&[data-nav-colapsado=true]]:md:pl-16">
      {verComo && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <span>
            👁 Vista previa activa: <strong>{ETIQUETAS_ROL[verComo]}</strong> — así ve el dashboard este rol
          </span>
          <form action={desactivarVistaPrevia}>
            <button type="submit" className="rounded px-2 py-0.5 text-xs font-semibold underline hover:no-underline">
              Salir de vista previa
            </button>
          </form>
        </div>
      )}
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
      <InmobiliariaNav esGestor={gestor} />
    </div>
  );
}
