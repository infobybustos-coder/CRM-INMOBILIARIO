import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ETIQUETAS_ESTADO: Record<string, string> = {
  captacion: "Captación",
  preparacion: "Preparación",
  publicado: "Publicado",
  visitas: "Visitas",
  oferta: "Oferta",
  reservado: "Reservado",
  vendido: "Vendido",
};

export default async function InmueblesPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data: inmuebles } = await supabase
    .from("inmuebles")
    .select("id, direccion, precio, estado")
    .eq("agente_id", usuario.id)
    .order("creado_en", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inmuebles</h1>

      {!inmuebles || inmuebles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no tienes inmuebles registrados.
        </p>
      ) : (
        <ul className="space-y-2">
          {inmuebles.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div>
                <p className="font-medium">{i.direccion}</p>
                {i.precio && (
                  <p className="text-sm text-muted-foreground">
                    {Number(i.precio).toLocaleString("es-ES")} €
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {ETIQUETAS_ESTADO[i.estado] ?? i.estado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
