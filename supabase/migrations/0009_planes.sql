-- =====================================================================
-- 0009 — Planes de precios: Gratis (con límites) y de pago (ilimitado).
-- =====================================================================

ALTER TABLE tenants
  ADD COLUMN plan_tarifa TEXT NOT NULL DEFAULT 'gratis' CHECK (plan_tarifa IN ('gratis', 'pago'));
