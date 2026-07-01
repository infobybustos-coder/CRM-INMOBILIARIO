-- =====================================================================
-- 0009 — Equipos y roles: Modo Inmobiliaria
-- =====================================================================
-- 1. Invitaciones: permitir también a director_comercial crear invitaciones
-- 2. Usuarios: política UPDATE para que admin/director puedan cambiar rol y activo
-- 3. Inmuebles: añadir política RLS de agente (igual que propietarios/compradores)
-- =====================================================================

-- 1. Ampliar política de invitaciones a director_comercial
DROP POLICY IF EXISTS invitaciones_solo_admin ON invitaciones;
CREATE POLICY invitaciones_gestion ON invitaciones
  FOR ALL
  USING (
    tenant_id = current_tenant_id()
    AND current_user_rol() IN ('administrador', 'director_comercial')
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_rol() IN ('administrador', 'director_comercial')
  );

-- 2. Política UPDATE para que admin/director gestionen a otros miembros del equipo
CREATE POLICY usuarios_update_equipo ON usuarios
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_rol() IN ('administrador', 'director_comercial')
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_rol() IN ('administrador', 'director_comercial')
  );

-- 3. Política de agente en inmuebles (misma lógica que propietarios/compradores)
CREATE POLICY agente_solo_sus_inmuebles ON inmuebles
  FOR SELECT
  USING (
    current_user_rol() IN ('administrador', 'director_comercial')
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );
