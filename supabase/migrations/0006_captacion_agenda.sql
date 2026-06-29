-- =====================================================================
-- 0006 — Captación de propietarios: fuente del lead, guion de captación
-- y agenda (llamadas, visitas, tasaciones, recordatorios)
-- =====================================================================

-- Fuente del lead: de dónde vino el propietario
CREATE TYPE fuente_lead AS ENUM
  ('referido', 'portal_inmobiliario', 'redes_sociales', 'puerta_fria',
   'web', 'llamada_entrante', 'otro');

ALTER TABLE propietarios
  ADD COLUMN fuente_lead fuente_lead,
  ADD COLUMN guion_captacion JSONB;

-- Tipo y estado de los eventos de agenda
CREATE TYPE tipo_evento_agenda AS ENUM
  ('llamada', 'visita', 'tasacion', 'recordatorio');

CREATE TYPE estado_evento_agenda AS ENUM
  ('pendiente', 'completado', 'cancelado');

CREATE TABLE eventos_agenda (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id          UUID REFERENCES usuarios(id),
  entidad_tipo        TEXT CHECK (entidad_tipo IN ('propietario','comprador','inmueble')),
  entidad_id          UUID,
  tipo                tipo_evento_agenda NOT NULL,
  titulo              TEXT NOT NULL,
  descripcion         TEXT,
  fecha_hora          TIMESTAMPTZ NOT NULL,
  estado              estado_evento_agenda NOT NULL DEFAULT 'pendiente',
  creado_en           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_eventos_agenda_tenant ON eventos_agenda (tenant_id, fecha_hora);
CREATE INDEX idx_eventos_agenda_usuario ON eventos_agenda (usuario_id, fecha_hora);
CREATE INDEX idx_eventos_agenda_entidad ON eventos_agenda (entidad_tipo, entidad_id);

ALTER TABLE eventos_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_eventos_agenda ON eventos_agenda
  USING (tenant_id = current_tenant_id());
