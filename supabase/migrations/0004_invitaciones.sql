-- =====================================================================
-- 0004 — Invitaciones de equipo (solo plan "inmobiliaria")
-- El administrador genera un enlace con token; el invitado lo abre,
-- pone su nombre y contraseña, y queda vinculado al mismo tenant con
-- el rol que el administrador eligió.
-- =====================================================================

CREATE TABLE invitaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  rol             rol_usuario NOT NULL,
  token           TEXT UNIQUE NOT NULL,
  invitado_por    UUID REFERENCES usuarios(id),
  usado_en        TIMESTAMPTZ,
  expira_en       TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  creado_en       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invitaciones_tenant ON invitaciones (tenant_id);

ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY invitaciones_solo_admin ON invitaciones
  FOR ALL
  USING (
    tenant_id = current_tenant_id()
    AND current_user_rol() = 'administrador'
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_rol() = 'administrador'
  );
