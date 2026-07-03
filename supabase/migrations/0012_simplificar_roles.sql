-- =====================================================================
-- 0012 — Simplificar roles de "modo inmobiliaria" a solo 2: admin y empleado
-- =====================================================================
-- Antes: administrador, director_comercial, agente, captador
-- Ahora: admin, empleado
-- Mapeo de datos existentes:
--   administrador, director_comercial -> admin
--   agente, captador                  -> empleado
-- =====================================================================

CREATE TYPE rol_usuario_nuevo AS ENUM ('admin', 'empleado');

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

DROP TYPE rol_usuario;
ALTER TYPE rol_usuario_nuevo RENAME TO rol_usuario;

-- current_user_rol() no cambia: referencia el tipo por nombre, sigue válida.

-- =====================================================================
-- Recrear políticas que citaban los roles antiguos
-- =====================================================================

DROP POLICY IF EXISTS agente_solo_sus_propietarios ON propietarios;
CREATE POLICY agente_solo_sus_propietarios ON propietarios
  FOR SELECT
  USING (
    current_user_rol() = 'admin'
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );

DROP POLICY IF EXISTS agente_solo_sus_compradores ON compradores;
CREATE POLICY agente_solo_sus_compradores ON compradores
  FOR SELECT
  USING (
    current_user_rol() = 'admin'
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );

DROP POLICY IF EXISTS agente_solo_sus_inmuebles ON inmuebles;
CREATE POLICY agente_solo_sus_inmuebles ON inmuebles
  FOR SELECT
  USING (
    current_user_rol() = 'admin'
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );

DROP POLICY IF EXISTS invitaciones_gestion ON invitaciones;
DROP POLICY IF EXISTS invitaciones_solo_admin ON invitaciones;
CREATE POLICY invitaciones_gestion ON invitaciones
  FOR ALL
  USING (tenant_id = current_tenant_id() AND current_user_rol() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id() AND current_user_rol() = 'admin');

DROP POLICY IF EXISTS usuarios_update_equipo ON usuarios;
CREATE POLICY usuarios_update_equipo ON usuarios
  FOR UPDATE
  USING (tenant_id = current_tenant_id() AND current_user_rol() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id() AND current_user_rol() = 'admin');

DROP POLICY IF EXISTS agente_solo_sus_ofertas ON ofertas;
CREATE POLICY agente_solo_sus_ofertas ON ofertas FOR SELECT
  USING (current_user_rol() = 'admin' OR agente_id = auth.uid());

DROP POLICY IF EXISTS agente_solo_sus_ventas ON ventas;
CREATE POLICY agente_solo_sus_ventas ON ventas FOR SELECT
  USING (current_user_rol() = 'admin' OR agente_id = auth.uid());
