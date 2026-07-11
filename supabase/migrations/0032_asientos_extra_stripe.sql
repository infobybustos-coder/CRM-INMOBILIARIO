-- =====================================================================
-- 0032 — Price IDs de Stripe para asientos extra (admin/asesor adicional)
-- =====================================================================

ALTER TABLE config_planes
  ADD COLUMN IF NOT EXISTS admin_extra_stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS asesor_extra_stripe_price_id TEXT;
