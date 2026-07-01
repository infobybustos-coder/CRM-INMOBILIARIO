import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InvitarForm } from "./invitar-form";
import { FilaMiembro } from "./fila-miembro";
import { activarVistaPrevia } from "./ver-como-actions";

export default async function EquipoPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const esGestor = ["administrador", "director_comercial"].includes(usuario.rol);

  const supabase = await createClient();
  const { data: miembros } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email, rol, activo")
    .eq("tenant_id", usuario.tenant_id)
    .order("creado_en");

  const { data: invitacionesPendientes } = esGestor
    ? await supabase
        .from("invitaciones")
        .select("id, email, rol, creado_en")
        .eq("tenant_id", usuario.tenant_id)
        .is("usado_en", null)
        .order("creado_en", { ascending: false })
    : { data: [] };

  const ETIQUETAS_ROL: Record<string, string> = {
    administrador: "Administrador",
    director_comercial: "Director Comercial",
    agente: "Agente",
    captador: "Captador",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Equipo</h1>
        <p className="mt-2 text-muted-foreground">
          Personas con acceso a esta cuenta.
        </p>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Nombre</th>
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">Rol</th>
              {esGestor && (
                <th className="px-4 py-2 text-left font-medium">Estado</th>
              )}
            </tr>
          </thead>
          <tbody>
            {miembros?.map((m) =>
              esGestor ? (
                <FilaMiembro
                  key={m.id}
                  miembro={m}
                  esMiMismoId={m.id === usuario.id}
                />
              ) : (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{m.nombre_completo}</td>
                  <td className="px-4 py-2 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-2">{ETIQUETAS_ROL[m.rol] ?? m.rol}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {esGestor && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-medium">Vista previa por rol</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Simula cómo ve el dashboard cada tipo de usuario de tu equipo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { rol: "administrador", label: "Administrador", desc: "Acceso total" },
                { rol: "director_comercial", label: "Director Comercial", desc: "Gestión y equipo" },
                { rol: "agente", label: "Agente", desc: "Solo sus asignados" },
                { rol: "captador", label: "Captador", desc: "Solo captaciones" },
              ] as const
            ).map(({ rol, label, desc }) => (
              <form key={rol} action={activarVistaPrevia}>
                <input type="hidden" name="rol" value={rol} />
                <button
                  type="submit"
                  disabled={rol === usuario.rol}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-muted-foreground">{desc}</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {esGestor && (
        <>
          <InvitarForm />

          {invitacionesPendientes && invitacionesPendientes.length > 0 && (
            <div>
              <h2 className="text-lg font-medium">Invitaciones pendientes</h2>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {invitacionesPendientes.map((inv) => (
                  <li key={inv.id}>
                    {inv.email} — {ETIQUETAS_ROL[inv.rol] ?? inv.rol}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
