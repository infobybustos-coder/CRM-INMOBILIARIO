import Link from "next/link";

export const metadata = { title: "Términos y Condiciones" };

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6 text-sm leading-relaxed">
      <Link href="/signup" className="text-muted-foreground hover:text-foreground">
        ← Volver al registro
      </Link>
      <h1 className="text-2xl font-semibold">Términos y Condiciones</h1>
      <p className="text-muted-foreground">
        Documento en preparación. Al usar el CRM aceptas que el servicio se presta &quot;tal cual&quot;,
        que los datos que introduces son responsabilidad tuya y que podremos actualizar estas
        condiciones a medida que el producto evolucione. Aquí se publicará el texto legal completo
        antes del lanzamiento.
      </p>
    </div>
  );
}
