import { getUsuarioConTenant } from "@/lib/auth";

export default async function InmobiliariaPage() {
  const usuario = await getUsuarioConTenant();
  const esAdmin = usuario?.rol === "admin";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Hola, {usuario?.nombre_completo ?? usuario?.email}
      </h1>
      <p className="text-sm text-muted-foreground">
        {esAdmin
          ? "Vista general del equipo. Aquí irán los indicadores de toda la inmobiliaria."
          : "Tu vista de trabajo. Aquí irán tus captaciones, inmuebles y compradores asignados."}
      </p>

      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Panel en construcción — vamos añadiendo módulos (propietarios, inmuebles,
        compradores, agenda) uno por uno.
      </div>
    </div>
  );
}
