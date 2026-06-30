export type TipoPlan = "asesor" | "inmobiliaria";
export type PlanTarifa = "gratis" | "pago";

export const LIMITES_GRATIS = {
  propietarios: 3,
  inmuebles: 3,
  compradores: 2,
} as const;

export const PRECIO_MENSUAL: Record<TipoPlan, number> = {
  asesor: 9.99,
  inmobiliaria: 19.99,
};

export const ASESORES_INCLUIDOS_INMOBILIARIA = 2;
export const PRECIO_ASESOR_EXTRA = 7.99;

export function esIlimitado(tenant: { plan_tarifa?: string | null }) {
  return tenant.plan_tarifa === "pago";
}

export function limiteRecurso(
  tenant: { plan_tarifa?: string | null },
  recurso: keyof typeof LIMITES_GRATIS
): number | null {
  if (esIlimitado(tenant)) return null;
  return LIMITES_GRATIS[recurso];
}

export function etiquetaPlan(tenant: { tipo_plan?: string | null; plan_tarifa?: string | null }) {
  if (tenant.plan_tarifa !== "pago") return "Gratis";
  return tenant.tipo_plan === "inmobiliaria" ? "Inmobiliaria" : "Asesor";
}

export function precioPlan(tenant: { tipo_plan?: string | null; plan_tarifa?: string | null }) {
  if (tenant.plan_tarifa !== "pago") return 0;
  return PRECIO_MENSUAL[(tenant.tipo_plan as TipoPlan) ?? "asesor"];
}
