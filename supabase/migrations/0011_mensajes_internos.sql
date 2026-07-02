-- Mensajería interna entre admin y agentes
CREATE TABLE IF NOT EXISTS mensajes_internos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  emisor_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  receptor_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido    TEXT NOT NULL,
  leido        BOOLEAN NOT NULL DEFAULT false,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_receptor ON mensajes_internos(receptor_id, leido);
CREATE INDEX IF NOT EXISTS idx_mensajes_tenant ON mensajes_internos(tenant_id, creado_en DESC);

ALTER TABLE mensajes_internos ENABLE ROW LEVEL SECURITY;

-- Only members of the same tenant can see messages
CREATE POLICY "tenant_mensajes_isolation" ON mensajes_internos
  FOR ALL USING (tenant_id = current_tenant_id());
