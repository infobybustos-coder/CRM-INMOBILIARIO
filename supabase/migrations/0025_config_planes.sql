-- =====================================================================
-- 0025 — Configuración de planes editable desde el panel de superadmin
-- (fila única) en vez de constantes fijas en el código. Lectura pública
-- (el selector de planes y el registro la necesitan sin sesión de
-- tenant); solo el rol de servicio puede escribir.
-- =====================================================================

CREATE TABLE IF NOT EXISTS config_planes (
  id                                      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  asesor_free_propietarios                INTEGER NOT NULL DEFAULT 3,
  asesor_free_inmuebles                   INTEGER NOT NULL DEFAULT 3,
  asesor_free_compradores                 INTEGER NOT NULL DEFAULT 3,
  asesor_pro_precio                       NUMERIC(10, 2) NOT NULL DEFAULT 9.99,
  inmobiliaria_free_propietarios          INTEGER NOT NULL DEFAULT 10,
  inmobiliaria_free_inmuebles             INTEGER NOT NULL DEFAULT 10,
  inmobiliaria_free_compradores           INTEGER NOT NULL DEFAULT 10,
  inmobiliaria_free_administradores       INTEGER NOT NULL DEFAULT 1,
  inmobiliaria_free_asesores              INTEGER NOT NULL DEFAULT 2,
  inmobiliaria_pro_precio                 NUMERIC(10, 2) NOT NULL DEFAULT 19.99,
  inmobiliaria_pro_administradores        INTEGER NOT NULL DEFAULT 2,
  inmobiliaria_pro_asesores               INTEGER NOT NULL DEFAULT 2,
  inmobiliaria_pro_precio_admin_extra     NUMERIC(10, 2) NOT NULL DEFAULT 9.99,
  inmobiliaria_pro_precio_asesor_extra    NUMERIC(10, 2) NOT NULL DEFAULT 7.99,
  actualizado_en                          TIMESTAMPTZ DEFAULT now()
);

INSERT INTO config_planes (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE config_planes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_planes es de lectura pública"
  ON config_planes
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- Sin política de escritura: solo se actualiza con el rol de servicio
-- desde las acciones del panel de superadmin.
