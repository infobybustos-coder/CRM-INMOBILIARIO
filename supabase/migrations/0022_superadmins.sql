-- =====================================================================
-- 0022 — Superadmins: acceso a nivel de plataforma, independiente de
-- cualquier tenant. Un superadmin no pertenece a la tabla usuarios (esa
-- es siempre por tenant); solo necesita tener su auth.uid() en esta
-- tabla. Sin políticas de escritura: añadir/quitar superadmins se hace
-- a mano desde el SQL Editor con el rol de servicio.
-- =====================================================================

CREATE TABLE IF NOT EXISTS superadmins (
  usuario_id  UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  creado_en   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede comprobar si SU PROPIO id está en
-- la tabla (para el guard de acceso), pero no puede ver la lista de
-- otros superadmins ni modificarla.
CREATE POLICY "cada usuario ve solo su propia fila de superadmin"
  ON superadmins
  FOR SELECT
  USING (usuario_id = auth.uid());
