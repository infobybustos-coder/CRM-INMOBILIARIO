import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { tieneMensajeClienteSinLeer } from "@/lib/soporte/db";
import { signOut } from "../(auth)/actions";
import { SuperadminNav } from "@/components/superadmin/nav";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperadmin();

  const avisoSoporte = await tieneMensajeClienteSinLeer(createAdminClient());

  return (
    <div className="min-h-screen bg-background text-foreground md:pl-56">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Superadmin</span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Cerrar sesión
          </button>
        </form>
      </header>
      <SuperadminNav avisos={{ "/superadmin/soporte": avisoSoporte }} />
      <main className="p-4 pb-20 md:pb-4">{children}</main>
    </div>
  );
}
