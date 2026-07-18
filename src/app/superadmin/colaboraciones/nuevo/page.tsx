import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CrearColaboradorForm } from "@/components/superadmin/colaboraciones/crear-colaborador-form";

export default function NuevoColaboradorPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/superadmin/colaboraciones"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a Colaboraciones
      </Link>
      <h1 className="text-2xl font-semibold">Crear colaborador</h1>
      <CrearColaboradorForm />
    </div>
  );
}
