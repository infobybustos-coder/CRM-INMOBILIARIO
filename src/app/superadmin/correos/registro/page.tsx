import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarRegistroCorreos } from "@/lib/correos/db";
import { RegistroCorreos } from "@/components/superadmin/correos/registro-correos";

export default async function RegistroCorreosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const admin = createAdminClient();
  const registros = await listarRegistroCorreos(admin, { destinatario: params.q, limite: 100 });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/superadmin/correos"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a Correos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Registro de envíos</h1>
        <p className="text-sm text-muted-foreground">
          Últimos {registros.length === 100 ? "100" : registros.length} correos enviados por Ambraio, con su
          estado. Si uno no llegó, puedes reenviarlo con el mismo contenido.
        </p>
      </div>

      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Buscar por email del destinatario..."
          className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          Buscar
        </button>
        {params.q && (
          <Link
            href="/superadmin/correos/registro"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Limpiar
          </Link>
        )}
      </form>

      <RegistroCorreos registros={registros} />
    </div>
  );
}
