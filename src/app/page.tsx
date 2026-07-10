import { redirect } from "next/navigation";
import { getUsuarioConTenant, esSuperadmin } from "@/lib/auth";
import { obtenerConfigLanding } from "@/lib/landing-config";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  if (await esSuperadmin()) {
    redirect("/superadmin");
  }

  const usuario = await getUsuarioConTenant();

  if (usuario) {
    redirect(usuario.tenant?.tipo_plan === "inmobiliaria" ? "/inmobiliaria" : "/asesor");
  }

  const [config, planes] = await Promise.all([obtenerConfigLanding(), obtenerConfigPlanes()]);

  return <LandingPage config={config} planes={planes} />;
}
