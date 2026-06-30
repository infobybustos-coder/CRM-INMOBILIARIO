import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { AjustesForm } from "@/components/asesor/ajustes-form";

export default async function AjustesPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <AjustesForm
        monedaInicial={(usuario.moneda as "EUR" | "USD") ?? "EUR"}
        idiomaInicial={(usuario.idioma as "es" | "en") ?? "es"}
      />
    </div>
  );
}
