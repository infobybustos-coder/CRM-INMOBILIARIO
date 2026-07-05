import { requireAdminInmobiliaria } from "@/lib/auth";
import { PreferenciasForm } from "@/components/inmobiliaria/preferencias-form";
import { ConfiguracionTabs } from "@/components/inmobiliaria/configuracion-tabs";

export default async function PreferenciasPage() {
  await requireAdminInmobiliaria();

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <ConfiguracionTabs />

      <h2 className="text-lg font-semibold">Preferencias</h2>
      <PreferenciasForm />
    </div>
  );
}
