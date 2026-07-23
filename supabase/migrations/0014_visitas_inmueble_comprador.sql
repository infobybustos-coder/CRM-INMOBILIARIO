-- =====================================================================
-- 0014 — Enlazar visitas (eventos_agenda) a un inmueble y un comprador
-- =====================================================================
-- eventos_agenda es polimórfico (entidad_tipo/entidad_id apunta a UNA
-- sola entidad), pero una visita necesariamente involucra un inmueble
-- Y un comprador a la vez. Se añaden estas dos columnas específicas
-- para el módulo de Visitas, sin tocar el resto de tipos de evento.
-- =====================================================================

ALTER TABLE eventos_agenda
  ADD COLUMN IF NOT EXISTS inmueble_id  UUID REFERENCES inmuebles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS comprador_id UUID REFERENCES compradores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_agenda_inmueble ON eventos_agenda (inmueble_id);
CREATE INDEX IF NOT EXISTS idx_eventos_agenda_comprador ON eventos_agenda (comprador_id);
