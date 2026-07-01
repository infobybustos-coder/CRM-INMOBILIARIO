import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { signOut } from "../(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function InmobiliariaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();

  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "inmobiliaria") redirect("/asesor");

  const esGestor = ["administrador", "director_comercial"].includes(usuario.rol);
  const esCaptador = usuario.rol === "captador";

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">{usuario.tenant?.nombre}</span>
          {!esCaptador && (
            <Link
              href="/inmobiliaria/compradores"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Compradores
            </Link>
          )}
          {!esCaptador && (
            <Link
              href="/inmobiliaria/inmuebles"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Inmuebles
            </Link>
          )}
          {esGestor && (
            <Link
              href="/inmobiliaria/equipo"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Equipo
            </Link>
          )}
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            Cerrar sesión
          </Button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
