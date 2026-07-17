import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { esClavePlantilla } from "@/lib/correos/tipos";
import { obtenerPlantilla, obtenerConfigCorreos } from "@/lib/correos/db";
import { EditorPlantilla } from "@/components/superadmin/correos/editor-plantilla";

export default async function EditorPlantillaPage({
  params,
}: {
  params: Promise<{ clave: string }>;
}) {
  const { clave } = await params;
  if (!esClavePlantilla(clave)) notFound();

  const admin = createAdminClient();
  const [plantilla, config] = await Promise.all([obtenerPlantilla(admin, clave), obtenerConfigCorreos(admin)]);
  if (!plantilla) notFound();

  return (
    <div className="space-y-4">
      <Link href="/superadmin/correos" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a Correos
      </Link>
      <EditorPlantilla plantilla={plantilla} config={config} />
    </div>
  );
}
