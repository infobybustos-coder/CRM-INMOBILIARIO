import Link from "next/link";

export const metadata = { title: "Política de Privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6 text-sm leading-relaxed">
      <Link href="/signup" className="text-muted-foreground hover:text-foreground">
        ← Volver al registro
      </Link>
      <h1 className="text-2xl font-semibold">Política de Privacidad</h1>
      <p className="text-muted-foreground">
        Documento en preparación. Tratamos tus datos (nombre, email, teléfono y los registros que
        introduces en el CRM) únicamente para prestarte el servicio, y no los compartimos con
        terceros salvo obligación legal. Aquí se publicará la política completa antes del
        lanzamiento.
      </p>
    </div>
  );
}
