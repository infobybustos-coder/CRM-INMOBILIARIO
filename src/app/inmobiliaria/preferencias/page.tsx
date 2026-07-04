import { requireAdminInmobiliaria } from "@/lib/auth";
import { PreferenciasForm } from "@/components/inmobiliaria/preferencias-form";

export default async function PreferenciasPage() {
  await requireAdminInmobiliaria();

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-semibold">Preferencias</h1>
      <PreferenciasForm />
    </div>
  );
}
