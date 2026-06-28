import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { signOut } from "../(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function AsesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();

  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "asesor") redirect("/inmobiliaria");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">{usuario.tenant?.nombre}</span>
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
