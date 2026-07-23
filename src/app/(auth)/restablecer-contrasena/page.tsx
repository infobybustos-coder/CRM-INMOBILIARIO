import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RestablecerContrasenaForm } from "@/components/auth/restablecer-contrasena-form";

export default async function RestablecerContrasenaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {user ? (
        <RestablecerContrasenaForm />
      ) : (
        <div className="w-full max-w-sm space-y-4 rounded-lg border p-6">
          <h1 className="text-xl font-semibold">Enlace no válido</h1>
          <p className="text-sm text-muted-foreground">
            Este enlace de recuperación ha caducado o ya se usó. Solicita uno nuevo.
          </p>
          <Link
            href="/recuperar-contrasena"
            className="block w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Pedir un enlace nuevo
          </Link>
        </div>
      )}
    </div>
  );
}
