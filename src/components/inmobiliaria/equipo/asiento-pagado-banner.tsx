import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CopiarEnlace } from "@/components/inmobiliaria/equipo/copiar-enlace";

// Cuando el asiento extra se paga vía checkout (PRO activado a mano, sin
// suscripción previa de Stripe), el email del nuevo miembro se recoge
// dentro de la propia pantalla de Stripe: al volver aquí no lo tenemos
// en la URL, así que se busca la invitación más reciente sin usar de
// ese tenant para poder mostrar su enlace.
export async function AsientoPagadoBanner({ tenantId }: { tenantId: string }) {
  const admin = createAdminClient();
  const { data: invitacion } = await admin
    .from("invitaciones")
    .select("token, email")
    .eq("tenant_id", tenantId)
    .is("usado_en", null)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invitacion) {
    return (
      <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500">
        Pago confirmado. Estamos generando la invitación — recarga esta página en unos segundos si
        todavía no ves el enlace.
      </p>
    );
  }

  const listaHeaders = await headers();
  const host = listaHeaders.get("host");
  const protocolo = host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https";
  const link = `${protocolo}://${host}/invitar/${invitacion.token}`;

  return (
    <div className="space-y-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-500">
      <p>Pago confirmado — el asiento se ha añadido a tu plan. Comparte este enlace con {invitacion.email}:</p>
      <CopiarEnlace link={link} />
    </div>
  );
}
