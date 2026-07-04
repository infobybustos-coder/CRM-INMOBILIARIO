import { requireAdminInmobiliaria } from "@/lib/auth";
import { FormularioEmpresa } from "@/components/inmobiliaria/empresa/formulario-empresa";

export default async function EmpresaPage() {
  const usuario = await requireAdminInmobiliaria();
  const tenant = usuario.tenant ?? {};

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Empresa</h1>

      <FormularioEmpresa
        tenantId={usuario.tenant_id}
        nombre={tenant.nombre ?? ""}
        cifNif={tenant.cif_nif ?? null}
        telefono={tenant.telefono ?? null}
        email={tenant.email ?? null}
        direccion={tenant.direccion ?? null}
        web={tenant.web ?? null}
        zonaHoraria={tenant.zona_horaria ?? null}
        logoUrl={tenant.logo_url ?? null}
      />
    </div>
  );
}
