import { createAdminClient } from "@/lib/supabase/admin";
import { VistaPreviaBotones } from "@/components/superadmin/vista-previa-boton";

export default async function ConfiguracionPage() {
  const admin = createAdminClient();
  const { data: superadmins } = await admin
    .from("superadmins")
    .select("usuario_id, creado_en")
    .order("creado_en", { ascending: true });

  const filas = await Promise.all(
    (superadmins ?? []).map(async (s) => {
      const { data } = await admin.auth.admin.getUserById(s.usuario_id);
      return {
        id: s.usuario_id,
        email: data.user?.email ?? "—",
        creadoEn: s.creado_en,
      };
    })
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <div className="max-w-lg space-y-2">
        <h2 className="text-sm font-semibold">Vista previa de interfaz</h2>
        <p className="text-xs text-muted-foreground">
          Entra a una cuenta de demostración propia de Ambraio (nunca a la cuenta de un cliente
          real) para comprobar cómo se ve cada combinación de rol y plan, Gratis o PRO.
        </p>
        <VistaPreviaBotones />
      </div>

      <div className="max-w-lg space-y-2">
        <h2 className="text-sm font-semibold">Superadmins</h2>
        <p className="text-xs text-muted-foreground">
          Por ahora solo se pueden añadir o quitar desde el SQL Editor de Supabase (tabla
          superadmins).
        </p>
        <ul className="divide-y rounded-lg border">
          {filas.map((f) => (
            <li key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{f.email}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(f.creadoEn).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
