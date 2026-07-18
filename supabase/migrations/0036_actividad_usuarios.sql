-- =====================================================================
-- 0036 — Seguimiento de actividad de cada usuario ("conectado ahora",
-- tiempo desde la última actividad) para el panel de supervisión del
-- superadmin, y tamaño de cada documento subido para poder calcular
-- espacio usado por cliente. Sin Realtime: la app actualiza
-- "ultima_actividad" con un latido periódico mientras la pestaña está
-- abierta (ver src/lib/actividad.ts), y el superadmin ve el dato
-- calculado en cada carga de página.
-- =====================================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS ultima_actividad TIMESTAMPTZ;

ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS tamano_bytes INTEGER;

-- El panel de supervisión del superadmin registra en el historial del
-- tenant cuando envía un restablecimiento de contraseña.
ALTER TABLE tenant_eventos DROP CONSTRAINT IF EXISTS tenant_eventos_tipo_check;
ALTER TABLE tenant_eventos ADD CONSTRAINT tenant_eventos_tipo_check
  CHECK (tipo IN ('estado', 'plan', 'impersonacion', 'soporte'));
