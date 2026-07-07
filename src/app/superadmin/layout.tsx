import { requireSuperadmin } from "@/lib/auth";
import { signOut } from "../(auth)/actions";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperadmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Superadmin</span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
