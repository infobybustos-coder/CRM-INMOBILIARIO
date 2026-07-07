import { obtenerConfigPlanes } from "@/lib/planes-config";
import { SignupWizard } from "./signup-wizard";

export default async function SignupPage() {
  const config = await obtenerConfigPlanes();
  return <SignupWizard config={config} />;
}
