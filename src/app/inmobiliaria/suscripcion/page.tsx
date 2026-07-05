import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SelectorPlan } from "@/components/inmobiliaria/suscripcion/selector-plan";
import {
  PRECIO_ASESOR_EXTRA,
  PRECIO_ADMIN_EXTRA,
  limiteAdmins,
  limiteEmpleados,
  etiquetaPlan,
  type PlanTarifa,
} from "@/lib/planes";
import { cn } from "@/lib/utils";

const ETIQUETA_ESTADO_SUSCRIPCION: Record<string, string> = {
  trial: "Periodo de prueba",
  activa: "Activa",
  pausada: "Pausada",
  cancelada: "Cancelada",
  impago: "Impago",
};

export default async function SuscripcionPage() {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();

  const { data: suscripcion } = await supabase
    .from("suscripciones")
    .select("plan, estado, fecha_renovacion")
    .eq("tenant_id", usuario.tenant_id)
    .maybeSingle();

  const tenant = usuario.tenant ?? {};

  const [{ count: adminsActivos }, { count: empleadosActivos }] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("rol", "admin")
      .eq("activo", true),
    supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("rol", "empleado")
      .eq("activo", true),
  ]);

  const limiteAdminsTenant = limiteAdmins(tenant);
  const limiteEmpleadosTenant = limiteEmpleados(tenant);
  const adminsExtra = tenant.plan_tarifa === "pago" ? (tenant.admins_extra ?? 0) : 0;
  const agentesExtra = tenant.plan_tarifa === "pago" ? (tenant.agentes_extra ?? 0) : 0;
  const costeExtra = agentesExtra * PRECIO_ASESOR_EXTRA + adminsExtra * PRECIO_ADMIN_EXTRA;

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-semibold">Suscripción</h1>

      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Plan actual</p>
          <p className="font-medium">{etiquetaPlan(tenant)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estado</p>
          <p className="font-medium">
            {ETIQUETA_ESTADO_SUSCRIPCION[suscripcion?.estado ?? ""] ?? "Sin suscripción activa"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Administradores</p>
          <p
            className={cn(
              "font-medium",
              (adminsActivos ?? 0) > limiteAdminsTenant && "text-destructive"
            )}
          >
            {adminsActivos ?? 0} de {limiteAdminsTenant}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Asesores</p>
          <p
            className={cn(
              "font-medium",
              (empleadosActivos ?? 0) > limiteEmpleadosTenant && "text-destructive"
            )}
          >
            {empleadosActivos ?? 0} de {limiteEmpleadosTenant}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Próxima renovación</p>
          <p className="font-medium">
            {suscripcion?.fecha_renovacion
              ? new Date(suscripcion.fecha_renovacion).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        {costeExtra > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Asientos extra</p>
            <p className="font-medium">
              {agentesExtra > 0 && `${agentesExtra} agente(s)`}
              {agentesExtra > 0 && adminsExtra > 0 && " · "}
              {adminsExtra > 0 && `${adminsExtra} admin(es)`} (+{costeExtra.toFixed(2).replace(".", ",")}
              €/mes)
            </p>
          </div>
        )}
      </div>

      {((adminsActivos ?? 0) > limiteAdminsTenant || (empleadosActivos ?? 0) > limiteEmpleadosTenant) && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          Tienes más administradores o asesores activos de los que incluye tu plan actual. Elimina o
          desactiva usuarios desde Administradores/Agentes, o pasa al plan PRO para ampliar.
        </p>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Elige tu plan</h2>
        <SelectorPlan planActual={(tenant.plan_tarifa as PlanTarifa) ?? "gratis"} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground opacity-50"
          title="Próximamente"
        >
          Gestionar pago
        </button>
        <button
          type="button"
          disabled
          className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground opacity-50"
          title="Próximamente"
        >
          Descargar facturas
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Cambiar de plan aquí no procesa ningún cobro real todavía — no hay pasarela de pago
        conectada. La gestión de pago y las facturas estarán disponibles próximamente.
      </p>
    </div>
  );
}
