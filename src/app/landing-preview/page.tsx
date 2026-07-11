import { redirect } from "next/navigation";
import { esSuperadmin } from "@/lib/auth";
import { obtenerConfigLanding } from "@/lib/landing-config";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import { LandingPage } from "@/components/landing/landing-page";

export default async function LandingPreviewPage() {
  if (!(await esSuperadmin())) {
    redirect("/");
  }

  const [config, planes] = await Promise.all([obtenerConfigLanding(), obtenerConfigPlanes()]);

  return <LandingPage config={config} planes={planes} moneda="EUR" />;
}
