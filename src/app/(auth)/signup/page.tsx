import { obtenerConfigPlanes } from "@/lib/planes-config";
import { SignupWizard } from "./signup-wizard";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const config = await obtenerConfigPlanes();
  const tipoInicial = params.tipo === "asesor" || params.tipo === "inmobiliaria" ? params.tipo : null;
  return <SignupWizard config={config} tipoInicial={tipoInicial} />;
}
