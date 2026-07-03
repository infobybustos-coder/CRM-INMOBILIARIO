-- =====================================================================
-- 0012 — Simplificar roles de "modo inmobiliaria" a solo 2: admin y empleado
-- =====================================================================
-- Antes: administrador, director_comercial, agente, captador
-- Ahora: admin, empleado
-- Mapeo de datos existentes:
--   administrador, director_comercial -> admin
--   agente, captador                  -> empleado
-- =====================================================================

DROP TYPE IF EXISTS rol_usuario_nuevo;
CREATE TYPE rol_usuario_nuevo AS ENUM ('admin', 'empleado');

-- =====================================================================
-- 1. Migrar los datos de las columnas que usan el tipo viejo
-- =====================================================================

ALTER TABLE usuarios ALTER COLUMN rol DROP DEFAULT;
ALTER TABLE usuarios
  ALTER COLUMN rol TYPE rol_usuario_nuevo
  USING (
    CASE rol::text
      WHEN 'administrador' THEN 'admin'
      WHEN 'director_comercial' THEN 'admin'
      ELSE 'empleado'
    END
  )::rol_usuario_nuevo;
ALTER TABLE usuarios ALTER COLUMN rol SET DEFAULT 'empleado';

ALTER TABLE invitaciones
  ALTER COLUMN rol TYPE rol_usuario_nuevo
  USING (
    CASE rol::text
      WHEN 'administrador' THEN 'admin'
      WHEN 'director_comercial' THEN 'admin'
      ELSE 'empleado'
    END
  )::rol_usuario_nuevo;

-- =====================================================================
-- 2. Quitar todo lo que todavía depende del tipo viejo (políticas + función)
--    Tiene que ir ANTES de poder borrar el tipo viejo.
-- =====================================================================

DROP POLICY IF EXISTS agente_solo_sus_propietarios ON propietarios;
DROP POLICY IF EXISTS agente_solo_sus_compradores ON compradores;
DROP POLICY IF EXISTS agente_solo_sus_inmuebles ON inmuebles;
DROP POLICY IF EXISTS invitaciones_gestion ON invitaciones;
DROP POLICY IF EXISTS invitaciones_solo_admin ON invitaciones;
DROP POLICY IF EXISTS usuarios_update_equipo ON usuarios;
DROP FUNCTION IF EXISTS current_user_rol();

-- =====================================================================
-- 3. Reemplazar el tipo viejo por el nuevo
-- =====================================================================

DROP TYPE rol_usuario;
ALTER TYPE rol_usuario_nuevo RENAME TO rol_usuario;

-- =====================================================================
-- 4. Recrear la función y las políticas, ya con los roles nuevos
-- =====================================================================

CREATE FUNCTION current_user_rol() RETURNS rol_usuario AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY agente_solo_sus_propietarios ON propietarios
  FOR SELECT
  USING (
    current_user_rol() = 'admin'
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );

CREATE POLICY agente_solo_sus_compradores ON compradores
  FOR SELECT
  USING (
    current_user_rol() = 'admin'
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );

CREATE POLICY agente_solo_sus_inmuebles ON inmuebles
  FOR SELECT
  USING (
    current_user_rol() = 'admin'
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );

CREATE POLICY invitaciones_gestion ON invitaciones
  FOR ALL
  USING (tenant_id = current_tenant_id() AND current_user_rol() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id() AND current_user_rol() = 'admin');

CREATE POLICY usuarios_update_equipo ON usuarios
  FOR UPDATE
  USING (tenant_id = current_tenant_id() AND current_user_rol() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id() AND current_user_rol() = 'admin');
