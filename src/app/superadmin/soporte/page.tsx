import { SoporteBuscador } from "@/components/superadmin/soporte-buscador";

export default function SoportePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Soporte</h1>
      <p className="text-sm text-muted-foreground">
        Busca una cuenta por email, teléfono o nombre para ayudar a un cliente.
      </p>
      <SoporteBuscador />
    </div>
  );
}
