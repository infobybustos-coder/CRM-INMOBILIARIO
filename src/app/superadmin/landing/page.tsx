import Link from "next/link";
import { obtenerConfigLanding } from "@/lib/landing-config";
import { LandingEditor } from "@/components/superadmin/landing-editor";
import { VistaPreviaLanding } from "@/components/superadmin/vista-previa-landing";

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
          Abrir en pestaña nueva →
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <LandingEditor config={config} />
        <VistaPreviaLanding />
      </div>
    </div>
  );
}
