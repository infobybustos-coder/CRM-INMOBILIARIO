import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ETIQUETAS_ESTADO: Record<string, string> = {
  nuevo_lead: "Nuevo lead",
  contactado: "Contactado",
  tasacion_programada: "Tasación programada",
  tasacion_realizada: "Tasación realizada",
  negociacion: "Negociación",
  exclusiva_firmada: "Exclusiva firmada",
  captado: "Captado",
  perdido: "Perdido",
};

export default async function PropietariosPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data: propietarios } = await supabase
    .from("propietarios")
    .select("id, nombre, telefono, estado")
    .eq("agente_id", usuario.id)
    .order("creado_en", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Propietarios</h1>

      {!propietarios || propietarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no tienes propietarios. Usa el botón + para añadir uno.
        </p>
      ) : (
        <ul className="space-y-2">
          {propietarios.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div>
                <p className="font-medium">{p.nombre}</p>
                <p className="text-sm text-muted-foreground">{p.telefono}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {ETIQUETAS_ESTADO[p.estado] ?? p.estado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
