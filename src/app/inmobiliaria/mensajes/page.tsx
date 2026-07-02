import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioMensaje } from "./formulario-mensaje";
import { MessageSquare, CheckCheck } from "lucide-react";
import { marcarLeido } from "./actions";
import { cn } from "@/lib/utils";

export default async function MensajesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const params = await searchParams;
  const receptorId = params.a;

  const supabase = await createClient();

  const [{ data: recibidos }, { data: enviados }, { data: contactos }] = await Promise.all([
    supabase
      .from("mensajes_internos")
      .select("id, emisor_id, contenido, leido, creado_en")
      .eq("receptor_id", usuario.id)
      .order("creado_en", { ascending: false })
      .limit(50),
    supabase
      .from("mensajes_internos")
      .select("id, receptor_id, contenido, leido, creado_en")
      .eq("emisor_id", usuario.id)
      .order("creado_en", { ascending: false })
      .limit(50),
    supabase
      .from("usuarios")
      .select("id, nombre_completo")
      .eq("tenant_id", usuario.tenant_id)
      .eq("activo", true)
      .neq("id", usuario.id)
      .order("nombre_completo"),
  ]);

  const contactosMap = Object.fromEntries(
    (contactos ?? []).map((c) => [c.id, c.nombre_completo])
  );

  const sinLeer = (recibidos ?? []).filter((m) => !m.leido).length;

  function fmtFecha(iso: string) {
    const d = new Date(iso);
    const hoy = new Date();
    const esHoy = d.toDateString() === hoy.toDateString();
    if (esHoy) {
      return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Mensajes</h1>
        {sinLeer > 0 && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
            {sinLeer} sin leer
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            Nuevo mensaje
          </h2>
          {contactos && contactos.length > 0 ? (
            <FormularioMensaje contactos={contactos} receptorId={receptorId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay otros miembros en el equipo todavía.
            </p>
          )}
        </div>

        {/* Received */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Recibidos</h2>
          {(recibidos ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No has recibido mensajes aún.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(recibidos ?? []).map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-md border p-3 text-sm space-y-1",
                    !m.leido && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-xs text-muted-foreground">
                      {contactosMap[m.emisor_id] ?? "Usuario"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{fmtFecha(m.creado_en)}</span>
                  </div>
                  <p className="leading-snug">{m.contenido}</p>
                  {!m.leido && (
                    <form action={marcarLeido.bind(null, m.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <CheckCheck className="size-3" />
                        Marcar leído
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sent */}
      {(enviados ?? []).length > 0 && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Enviados</h2>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {(enviados ?? []).map((m) => (
              <li key={m.id} className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-xs text-muted-foreground">
                    Para: {contactosMap[m.receptor_id] ?? "Usuario"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {m.leido && <CheckCheck className="size-3 text-primary" />}
                    {fmtFecha(m.creado_en)}
                  </div>
                </div>
                <p className="leading-snug">{m.contenido}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
