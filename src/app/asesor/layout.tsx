import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { signOut } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { AsesorNav } from "@/components/asesor/nav";
import { QuickAdd } from "@/components/asesor/quick-add";
import { ThemeToggle } from "@/components/asesor/theme-toggle";

export default async function AsesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();

  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");

  return (
    <div className="tema-asesor min-h-screen bg-background text-foreground md:pl-(--nav-ancho)">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">{usuario.tenant?.nombre}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <main className="p-4 pb-24 md:pb-6">{children}</main>
      <AsesorNav />
      <QuickAdd />
    </div>
  );
}
