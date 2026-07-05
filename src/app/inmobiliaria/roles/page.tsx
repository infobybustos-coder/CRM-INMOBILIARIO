import { requireAdminInmobiliaria } from "@/lib/auth";
import { Crown, User, Check } from "lucide-react";
import { ConfiguracionTabs } from "@/components/inmobiliaria/configuracion-tabs";

const PERMISOS_ADMIN = [
  "Gestionar la empresa",
  "Gestionar usuarios (invitar, editar rol, desactivar)",
  "Ver todo el CRM (todos los agentes, todas las carteras)",
  "Configurar la suscripción",
];

const PERMISOS_ASESOR = ["Centro de Control", "Captación", "Seguimiento"];

export default async function RolesPage() {
  await requireAdminInmobiliaria();

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <ConfiguracionTabs />

      <div>
        <h2 className="text-lg font-semibold">Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          En esta versión los permisos son fijos: solo hay dos roles, para mantener el CRM simple.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Crown className="size-4 text-amber-500" /> Administrador
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Acceso completo al CRM.</p>
        <ul className="mt-3 space-y-1.5">
          {PERMISOS_ADMIN.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <User className="size-4 text-sky-500" /> Asesor
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo puede acceder a su propio trabajo del día a día.
        </p>
        <ul className="mt-3 space-y-1.5">
          {PERMISOS_ASESOR.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> {p}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          No puede modificar la configuración de la empresa.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        En una futura versión se podrán crear permisos personalizados.
      </p>
    </div>
  );
}
