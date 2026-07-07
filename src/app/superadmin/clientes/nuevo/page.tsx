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
          Da de alta una cuenta manualmente — útil para altas asistidas o cuentas de demostración.
        </p>
      </div>
      <CrearClienteForm />
    </div>
  );
}
