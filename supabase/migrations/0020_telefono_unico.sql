-- =====================================================================
-- 0020 — Un mismo teléfono no puede usarse en más de una cuenta
-- (evita altas duplicadas con el mismo número).
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_telefono_unico
  ON usuarios (telefono)
  WHERE telefono IS NOT NULL;
