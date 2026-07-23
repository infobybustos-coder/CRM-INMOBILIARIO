import { requireColaborador } from "@/lib/auth";
import { signOut } from "../(auth)/actions";

export default async function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const colaborador = await requireColaborador();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">🤝 Ambraio · Panel de colaborador</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{colaborador.nombre_completo}</span>
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4 md:p-6">{children}</main>
    </div>
  );
}
