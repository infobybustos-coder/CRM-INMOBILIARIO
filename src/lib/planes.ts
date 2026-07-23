export type TipoPlan = "asesor" | "inmobiliaria";
export type PlanTarifa = "gratis" | "pago";

export type LimitesRecursos = { propietarios: number; inmuebles: number; compradores: number };

// Todos los números configurables de los planes. Antes eran constantes
// fijas en este archivo; ahora viven en la tabla config_planes y se
// editan desde /superadmin/suscripciones sin tocar código. Este tipo es
// la forma que toman en memoria una vez leídos (o el valor por defecto
// si la tabla todavía no tiene fila).
export type ConfigPlanes = {
  asesorFree: LimitesRecursos;
  asesorProPrecio: number;
  inmobiliariaFree: LimitesRecursos & { administradores: number; asesores: number };
  inmobiliariaProPrecio: number;
  inmobiliariaProAdminsIncluidos: number;
  inmobiliariaProAsesoresIncluidos: number;
  precioAdminExtra: number;
  precioAsesorExtra: number;
  asesorProStripePriceId: string | null;
  inmobiliariaProStripePriceId: string | null;
  adminExtraStripePriceId: string | null;
  asesorExtraStripePriceId: string | null;
};

export const CONFIG_PLANES_POR_DEFECTO: ConfigPlanes = {
  asesorFree: { propietarios: 3, inmuebles: 3, compradores: 3 },
  asesorProPrecio: 9.99,
  inmobiliariaFree: { propietarios: 10, inmuebles: 10, compradores: 10, administradores: 1, asesores: 2 },
  inmobiliariaProPrecio: 19.99,
  inmobiliariaProAdminsIncluidos: 2,
  inmobiliariaProAsesoresIncluidos: 2,
  precioAdminExtra: 9.99,
  precioAsesorExtra: 7.99,
  asesorProStripePriceId: null,
  inmobiliariaProStripePriceId: null,
  adminExtraStripePriceId: null,
  asesorExtraStripePriceId: null,
};

export function adminsIncluidos(config: ConfigPlanes, tenant: { plan_tarifa?: string | null }) {
  return tenant.plan_tarifa === "pago" ? config.inmobiliariaProAdminsIncluidos : config.inmobiliariaFree.administradores;
}

// Los asientos extra solo existen en el plan PRO: en Gratis no se pueden
// comprar, así que aunque quedara algún admins_extra/agentes_extra residual
// de un plan de pago anterior, aquí se ignora.
export function limiteEmpleados(
  config: ConfigPlanes,
  tenant: { agentes_extra?: number | null; plan_tarifa?: string | null }
) {
  const base =
    tenant.plan_tarifa === "pago" ? config.inmobiliariaProAsesoresIncluidos : config.inmobiliariaFree.asesores;
  const extra = tenant.plan_tarifa === "pago" ? (tenant.agentes_extra ?? 0) : 0;
  return base + extra;
}

export function limiteAdmins(
  config: ConfigPlanes,
  tenant: { admins_extra?: number | null; plan_tarifa?: string | null }
) {
  const extra = tenant.plan_tarifa === "pago" ? (tenant.admins_extra ?? 0) : 0;
  return adminsIncluidos(config, tenant) + extra;
}

export function esIlimitado(tenant: { plan_tarifa?: string | null }) {
  return tenant.plan_tarifa === "pago";
}

export function limiteRecurso(
  config: ConfigPlanes,
  tenant: { plan_tarifa?: string | null; tipo_plan?: string | null },
  recurso: keyof LimitesRecursos
): number | null {
  if (esIlimitado(tenant)) return null;
  const tipoPlan = (tenant.tipo_plan as TipoPlan) ?? "asesor";
  const limites = tipoPlan === "inmobiliaria" ? config.inmobiliariaFree : config.asesorFree;
  return limites[recurso];
}

export function etiquetaPlan(tenant: { tipo_plan?: string | null; plan_tarifa?: string | null }) {
  if (tenant.plan_tarifa !== "pago") return "Gratis";
  return tenant.tipo_plan === "inmobiliaria" ? "Inmobiliaria" : "Asesor";
}

export function precioPlan(
  config: ConfigPlanes,
  tenant: { tipo_plan?: string | null; plan_tarifa?: string | null }
) {
  if (tenant.plan_tarifa !== "pago") return 0;
  return tenant.tipo_plan === "inmobiliaria" ? config.inmobiliariaProPrecio : config.asesorProPrecio;
}

// Precio real que paga un tenant: el plan base más los asientos extra que
// tenga comprados (solo aplican en PRO; en Gratis siempre son 0).
export function precioMensualTotal(
  config: ConfigPlanes,
  tenant: {
    tipo_plan?: string | null;
    plan_tarifa?: string | null;
    admins_extra?: number | null;
    agentes_extra?: number | null;
  }
) {
  const base = precioPlan(config, tenant);
  if (tenant.plan_tarifa !== "pago") return base;
  const adminsExtra = tenant.admins_extra ?? 0;
  const agentesExtra = tenant.agentes_extra ?? 0;
  return base + adminsExtra * config.precioAdminExtra + agentesExtra * config.precioAsesorExtra;
}
