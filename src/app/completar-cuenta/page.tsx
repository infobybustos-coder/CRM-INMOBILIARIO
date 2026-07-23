import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { CompletarCuentaWizard } from "./completar-cuenta-wizard";

export default async function CompletarCuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const invitacion = user
    ? (
        await admin
          .from("invitaciones_cliente")
          .select("empresa, contacto, completado")
          .eq("usuario_id", user.id)
          .maybeSingle()
      ).data
    : null;

  if (!user || !invitacion || invitacion.completado) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border p-6 text-center">
          <h1 className="text-lg font-semibold">Enlace no válido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este enlace de invitación ya se usó o no es válido. Pide al administrador que te
            envíe uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  const config = await obtenerConfigPlanes();

  return (
    <CompletarCuentaWizard config={config} empresa={invitacion.empresa} contacto={invitacion.contacto} />
  );
}
