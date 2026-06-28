import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AsesorDashboard() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const ahora = new Date().toISOString();

  const [propietariosProximos, compradoresProximos] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id, nombre, fecha_proxima_accion")
      .eq("agente_id", usuario.id)
      .not("fecha_proxima_accion", "is", null)
      .lte("fecha_proxima_accion", ahora)
      .order("fecha_proxima_accion")
      .limit(10),
    supabase
      .from("compradores")
      .select("id, nombre, fecha_proxima_accion")
      .eq("agente_id", usuario.id)
      .not("fecha_proxima_accion", "is", null)
      .lte("fecha_proxima_accion", ahora)
      .order("fecha_proxima_accion")
      .limit(10),
  ]);

  const acciones = [
    ...(propietariosProximos.data ?? []).map((p) => ({
      ...p,
      tipo: "propietario" as const,
    })),
    ...(compradoresProximos.data ?? []).map((c) => ({
      ...c,
      tipo: "comprador" as const,
    })),
  ].sort(
    (a, b) =>
      new Date(a.fecha_proxima_accion!).getTime() -
      new Date(b.fecha_proxima_accion!).getTime()
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Mi panel</h1>
        <p className="mt-1 text-muted-foreground">
          Hola, {usuario.nombre_completo?.split(" ")[0]}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/asesor/propietarios"
          className="rounded-lg border p-4 text-sm font-medium"
        >
          Propietarios
        </Link>
        <Link
          href="/asesor/compradores"
          className="rounded-lg border p-4 text-sm font-medium"
        >
          Compradores
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-medium">Próximas acciones</h2>
        {acciones.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No tienes acciones pendientes ni vencidas. ¡Vas al día!
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {acciones.map((a) => {
              const vencida = new Date(a.fecha_proxima_accion!) < new Date();
              return (
                <li key={`${a.tipo}-${a.id}`}>
                  <Link
                    href={`/asesor/${a.tipo === "comprador" ? "compradores" : "propietarios"}`}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                  >
                    <span>
                      <span className="font-medium">{a.nombre}</span>
                      <span className="ml-2 text-muted-foreground">
                        {a.tipo === "comprador" ? "Comprador" : "Propietario"}
                      </span>
                    </span>
                    <span
                      className={vencida ? "text-destructive" : "text-muted-foreground"}
                    >
                      {new Date(a.fecha_proxima_accion!).toLocaleDateString("es-ES")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
