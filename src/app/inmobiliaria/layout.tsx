import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { signOut } from "../(auth)/actions";
import { InmobiliariaNav } from "@/components/inmobiliaria/nav";
import { ThemeToggle } from "@/components/asesor/theme-toggle";
import { UserMenu } from "@/components/asesor/user-menu";
import { createClient } from "@/lib/supabase/server";

export default async function InmobiliariaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();

  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "inmobiliaria") redirect("/asesor");

  const gestor = esGestor(usuario.rol);
  const captador = usuario.rol === "captador";

  const supabase = await createClient();
  const avatarUrl = usuario.avatar_url
    ? supabase.storage.from("avatares").getPublicUrl(usuario.avatar_url).data.publicUrl
    : null;

  return (
    <div className="layout-inmobiliaria min-h-screen bg-background text-foreground md:pl-[var(--nav-ancho,14rem)] [&[data-nav-colapsado=true]]:md:pl-16">
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
      <InmobiliariaNav esGestor={gestor} esCaptador={captador} />
    </div>
  );
}
