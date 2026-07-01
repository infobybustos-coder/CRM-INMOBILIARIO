-- =====================================================================
-- 0010 — Visitas (confirmación + resultado), Ofertas y Ventas
-- =====================================================================

-- Ampliar eventos_agenda para registrar resultado de visitas
ALTER TABLE eventos_agenda
  ADD COLUMN IF NOT EXISTS confirmado   BOOLEAN,
  ADD COLUMN IF NOT EXISTS resultado    TEXT CHECK (resultado IN ('interesado','no_interesado','oferta','pendiente')),
  ADD COLUMN IF NOT EXISTS nota_resultado TEXT;

-- =====================================================================
-- OFERTAS
-- =====================================================================
CREATE TABLE IF NOT EXISTS ofertas (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inmueble_id           UUID REFERENCES inmuebles(id) ON DELETE SET NULL,
  comprador_id          UUID REFERENCES compradores(id) ON DELETE SET NULL,
  agente_id             UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  importe               NUMERIC(14,2) NOT NULL,
  estado                TEXT NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente','negociacion','contraoferta','aceptada','rechazada')),
  nota                  TEXT,
  contraoferta_importe  NUMERIC(14,2),
  contraoferta_nota     TEXT,
  creado_en             TIMESTAMPTZ DEFAULT now(),
  actualizado_en        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ofertas_tenant   ON ofertas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_inmueble ON ofertas (inmueble_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_agente   ON ofertas (agente_id);

ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ofertas ON ofertas
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY agente_solo_sus_ofertas ON ofertas FOR SELECT
  USING (
    current_user_rol() IN ('administrador','director_comercial')
    OR agente_id = auth.uid()
  );

-- =====================================================================
-- VENTAS
-- =====================================================================
CREATE TABLE IF NOT EXISTS ventas (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inmueble_id           UUID REFERENCES inmuebles(id) ON DELETE SET NULL,
  comprador_id          UUID REFERENCES compradores(id) ON DELETE SET NULL,
  agente_id             UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  oferta_id             UUID REFERENCES ofertas(id) ON DELETE SET NULL,
  precio_venta          NUMERIC(14,2),
  comision_porcentaje   NUMERIC(5,2),
  comision_importe      NUMERIC(14,2),
  estado                TEXT NOT NULL DEFAULT 'reserva'
                          CHECK (estado IN ('reserva','documentacion','firma','completada')),
  fecha_reserva         TIMESTAMPTZ,
  fecha_documentacion   TIMESTAMPTZ,
  fecha_firma           TIMESTAMPTZ,
  notas                 TEXT,
  creado_en             TIMESTAMPTZ DEFAULT now(),
  actualizado_en        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventas_tenant   ON ventas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ventas_inmueble ON ventas (inmueble_id);
CREATE INDEX IF NOT EXISTS idx_ventas_agente   ON ventas (agente_id);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ventas ON ventas
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY agente_solo_sus_ventas ON ventas FOR SELECT
  USING (
    current_user_rol() IN ('administrador','director_comercial')
    OR agente_id = auth.uid()
  );
