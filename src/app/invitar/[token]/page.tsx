import { createAdminClient } from "@/lib/supabase/admin";
import { AceptarInvitacionForm } from "./form";

export default async function InvitarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invitacion } = await admin
    .from("invitaciones")
    .select("email, rol, usado_en, expira_en, tenant:tenants(nombre)")
    .eq("token", token)
    .single();

  const invalida =
    !invitacion ||
    invitacion.usado_en !== null ||
    new Date(invitacion.expira_en) < new Date();

  if (invalida) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border p-6 text-center">
          <h1 className="text-lg font-semibold">Enlace no válido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta invitación ya se usó o caducó. Pide al administrador que te
            envíe una nueva.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">
          Te han invitado a {(invitacion.tenant as unknown as { nombre: string }[])?.[0]?.nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          Crea tu acceso con el email {invitacion.email}.
        </p>
        <AceptarInvitacionForm token={token} />
      </div>
    </div>
  );
}
