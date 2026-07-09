import Link from "next/link";
import { CrearClienteForm } from "@/components/superadmin/crear-cliente-form";

export default function NuevoClientePage() {
  return (
    <div className="space-y-4">
      <Link href="/superadmin/clientes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a Clientes
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Pon los datos de contacto y le enviamos un email para que complete su registro él mismo
          — elige Asesor o Inmobiliaria y su plan, igual que en el alta pública.
        </p>
      </div>
      <CrearClienteForm />
    </div>
  );
}
