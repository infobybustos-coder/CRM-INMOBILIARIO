import Link from "next/link";
import { obtenerConfigLanding } from "@/lib/landing-config";
import { LandingEditor } from "@/components/superadmin/landing-editor";

export default async function LandingConfigPage() {
  const config = await obtenerConfigLanding();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Landing</h1>
          <p className="text-sm text-muted-foreground">
            El texto de la página pública que ven los visitantes antes de registrarse.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Ver la landing →
        </Link>
      </div>
      <LandingEditor config={config} />
    </div>
  );
}
