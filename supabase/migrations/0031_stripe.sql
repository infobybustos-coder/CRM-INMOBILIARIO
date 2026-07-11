-- =====================================================================
-- 0031 — Columnas necesarias para cobrar de verdad con Stripe:
-- el ID de precio de Stripe de cada plan PRO (editable desde
-- /superadmin/suscripciones, sin tocar código), y el cliente/
-- suscripción de Stripe asociados a cada tenant, para poder
-- gestionar renovaciones y cancelaciones reales.
-- =====================================================================

ALTER TABLE config_planes
  ADD COLUMN IF NOT EXISTS asesor_pro_stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS inmobiliaria_pro_stripe_price_id TEXT;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
