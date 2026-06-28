import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ETIQUETAS_ESTADO: Record<string, string> = {
  nuevo: "Nuevo",
  cualificado: "Cualificado",
  busqueda_activa: "Búsqueda activa",
  visitas: "Visitas",
  oferta: "Oferta",
  reserva: "Reserva",
  comprado: "Comprado",
  perdido: "Perdido",
};

export default async function CompradoresPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data: compradores } = await supabase
    .from("compradores")
    .select("id, nombre, telefono, estado")
    .eq("agente_id", usuario.id)
    .order("creado_en", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Compradores</h1>

      {!compradores || compradores.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no tienes compradores. Usa el botón + para añadir uno.
        </p>
      ) : (
        <ul className="space-y-2">
          {compradores.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div>
                <p className="font-medium">{c.nombre}</p>
                <p className="text-sm text-muted-foreground">{c.telefono}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {ETIQUETAS_ESTADO[c.estado] ?? c.estado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
