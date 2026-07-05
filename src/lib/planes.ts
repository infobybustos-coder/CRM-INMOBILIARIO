export type TipoPlan = "asesor" | "inmobiliaria";
export type PlanTarifa = "gratis" | "pago";

export const LIMITES_GRATIS: Record<
  TipoPlan,
  { propietarios: number; inmuebles: number; compradores: number }
> = {
  asesor: { propietarios: 3, inmuebles: 3, compradores: 2 },
  inmobiliaria: { propietarios: 10, inmuebles: 10, compradores: 10 },
};

export const PRECIO_MENSUAL: Record<TipoPlan, number> = {
  asesor: 9.99,
  inmobiliaria: 19.99,
};

export const ASESORES_INCLUIDOS_INMOBILIARIA = 2;
export const PRECIO_ASESOR_EXTRA = 7.99;

export const ADMINS_INCLUIDOS_GRATIS = 1;
export const ADMINS_INCLUIDOS_PAGO = 2;
export const PRECIO_ADMIN_EXTRA = 9.99;

export function adminsIncluidos(tenant: { plan_tarifa?: string | null }) {
  return tenant.plan_tarifa === "pago" ? ADMINS_INCLUIDOS_PAGO : ADMINS_INCLUIDOS_GRATIS;
}

export function limiteEmpleados(tenant: { agentes_extra?: number | null }) {
  return ASESORES_INCLUIDOS_INMOBILIARIA + (tenant.agentes_extra ?? 0);
}

export function limiteAdmins(tenant: { admins_extra?: number | null; plan_tarifa?: string | null }) {
  return adminsIncluidos(tenant) + (tenant.admins_extra ?? 0);
}

export function esIlimitado(tenant: { plan_tarifa?: string | null }) {
  return tenant.plan_tarifa === "pago";
}

export function limiteRecurso(
  tenant: { plan_tarifa?: string | null; tipo_plan?: string | null },
  recurso: keyof (typeof LIMITES_GRATIS)["inmobiliaria"]
): number | null {
  if (esIlimitado(tenant)) return null;
  const tipoPlan = (tenant.tipo_plan as TipoPlan) ?? "asesor";
  return LIMITES_GRATIS[tipoPlan][recurso];
}

export function etiquetaPlan(tenant: { tipo_plan?: string | null; plan_tarifa?: string | null }) {
  if (tenant.plan_tarifa !== "pago") return "Gratis";
  return tenant.tipo_plan === "inmobiliaria" ? "Inmobiliaria" : "Asesor";
}

export function precioPlan(tenant: { tipo_plan?: string | null; plan_tarifa?: string | null }) {
  if (tenant.plan_tarifa !== "pago") return 0;
  return PRECIO_MENSUAL[(tenant.tipo_plan as TipoPlan) ?? "asesor"];
}
