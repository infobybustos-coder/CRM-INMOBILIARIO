-- =====================================================================
-- 0019 — El país del tenant deja de estar limitado a un enum corto
-- (15 países hispanos) para admitir cualquier código ISO del selector
-- de registro (todos los países).
-- =====================================================================

ALTER TABLE tenants
  ALTER COLUMN pais DROP DEFAULT;

ALTER TABLE tenants
  ALTER COLUMN pais TYPE TEXT USING pais::TEXT;

ALTER TABLE tenants
  ALTER COLUMN pais SET DEFAULT 'ES';

DROP TYPE pais_soportado;
