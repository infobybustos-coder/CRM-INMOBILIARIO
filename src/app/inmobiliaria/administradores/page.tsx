import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabla } from "@/components/inmobiliaria/administradores/tabla";
import { NuevoMiembro } from "@/components/inmobiliaria/equipo/nuevo-miembro";
import { AsientoPagadoBanner } from "@/components/inmobiliaria/equipo/asiento-pagado-banner";
import { limiteAdmins } from "@/lib/planes";
import { obtenerConfigPlanes } from "@/lib/planes-config";
import type { AdminFila } from "./constantes";

export default async function AdministradoresPage({
  searchParams,
}: {
  searchParams: Promise<{ asiento_pagado?: string }>;
}) {
  const usuario = await requireAdminInmobiliaria();
  const { asiento_pagado: asientoPagado } = await searchParams;
  const supabase = await createClient();
  const config = await obtenerConfigPlanes();

  const { data: admins, error } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email, activo, ultimo_acceso, creado_en")
    .eq("tenant_id", usuario.tenant_id)
    .eq("rol", "admin")
    .order("nombre_completo");

  const filas: AdminFila[] = (admins ?? []).map((a) => ({
    id: a.id,
    nombreCompleto: a.nombre_completo,
    email: a.email,
    activo: a.activo,
    ultimoAcceso: a.ultimo_acceso,
    creadoEn: a.creado_en,
  }));

  const limite = limiteAdmins(config, usuario.tenant ?? {});

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Administradores</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filas.length} de {limite} administradores incluidos en tu plan (activos e inactivos)
          </p>
        </div>
        <NuevoMiembro rol="admin" etiqueta="administrador" />
      </div>

      {asientoPagado && <AsientoPagadoBanner tenantId={usuario.tenant_id} />}

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
          <p className="font-medium">No se pudieron cargar los administradores.</p>
          <p className="mt-1 text-xs">{error.message}</p>
        </div>
      )}

      <Tabla admins={filas} usuarioActualId={usuario.id} />
    </div>
  );
}
