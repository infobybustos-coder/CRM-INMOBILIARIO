-- =====================================================================
-- 0023 — El tenant necesita más de un booleano: el panel de superadmin
-- distingue Activo / Suspendido / Cancelado (KPIs "Suspendidos" y
-- "Cancelados" por separado). Se sustituye tenants.activo por un
-- estado con esos tres valores.
-- =====================================================================

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'suspendido', 'cancelado'));

UPDATE tenants SET estado = CASE WHEN activo THEN 'activo' ELSE 'cancelado' END;

ALTER TABLE tenants DROP COLUMN activo;
