-- =====================================================================
-- 0024 — Historial por tenant, notas internas del equipo de soporte, y
-- un registro de auditoría independiente de tenants (para acciones
-- irreversibles como eliminar un tenant, que no debe desaparecer junto
-- con la fila que audita).
-- =====================================================================

CREATE TABLE IF NOT EXISTS tenant_eventos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('estado', 'plan', 'impersonacion')),
  descripcion TEXT NOT NULL,
  creado_en   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_notas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  texto       TEXT NOT NULL,
  creado_por  TEXT,
  creado_en   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS superadmin_auditoria (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accion      TEXT NOT NULL,
  detalle     TEXT,
  actor_email TEXT,
  creado_en   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tenant_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE superadmin_auditoria ENABLE ROW LEVEL SECURITY;
-- Sin políticas: igual que superadmins, solo se leen/escriben con el
-- rol de servicio desde las acciones del panel de superadmin.
