import Link from "next/link";
import { History } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarPlantillas, obtenerConfigCorreos } from "@/lib/correos/db";
import { ListaPlantillas } from "@/components/superadmin/correos/lista-plantillas";
import { ConfigMarca } from "@/components/superadmin/correos/config-marca";

export default async function CorreosPage() {
  const admin = createAdminClient();
  const [plantillas, config] = await Promise.all([listarPlantillas(admin), obtenerConfigCorreos(admin)]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Correos</h1>
          <p className="text-sm text-muted-foreground">
            Plantillas de los correos que envía Ambraio automáticamente. Los cambios se aplican al instante,
            sin necesidad de tocar código.
          </p>
        </div>
        <Link
          href="/superadmin/correos/registro"
          className="flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          <History className="size-3.5" /> Registro de envíos
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Plantillas</h2>
        <ListaPlantillas plantillas={plantillas} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Marca del correo</h2>
        <p className="text-xs text-muted-foreground">
          Color, logo y firma compartidos por todas las plantillas.
        </p>
        <ConfigMarca config={config} />
      </div>
    </div>
  );
}
