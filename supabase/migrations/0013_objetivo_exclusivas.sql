-- =====================================================================
-- 0013 — Objetivo mensual de exclusivas (Centro de Control, modo inmobiliaria)
-- =====================================================================

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS objetivo_exclusivas_mensual INTEGER NOT NULL DEFAULT 20;
