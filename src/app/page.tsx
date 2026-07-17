import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import { getUsuarioConTenant, esSuperadmin, esColaborador } from "@/lib/auth";
import { obtenerConfigLanding } from "@/lib/landing-config";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { monedaVisitante } from "@/lib/geo";
import { createAdminClient } from "@/lib/supabase/admin";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  if (await esSuperadmin()) {
    redirect("/superadmin");
  }
  if (await esColaborador()) {
    redirect("/colaborador");
  }

  const usuario = await getUsuarioConTenant();

  if (usuario) {
    redirect(usuario.tenant?.tipo_plan === "inmobiliaria" ? "/inmobiliaria" : "/asesor");
  }

  const [config, planes, moneda] = await Promise.all([
    obtenerConfigLanding(),
    obtenerConfigPlanes(),
    monedaVisitante(),
  ]);

  // Contabiliza la visita después de responder, sin añadir latencia a la
  // carga de la landing. El dominio se toma del propio request, así que
  // si el dominio público cambia, el contador se adapta solo.
  const dominio = (await headers()).get("host") ?? "desconocido";
  after(async () => {
    const admin = createAdminClient();
    await admin.rpc("incrementar_visita_landing", { p_dominio: dominio });
  });

  return <LandingPage config={config} planes={planes} moneda={moneda} />;
}
