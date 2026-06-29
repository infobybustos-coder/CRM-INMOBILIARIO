ALTER TABLE inmuebles
  ADD COLUMN referencia TEXT;

CREATE UNIQUE INDEX idx_inmuebles_referencia_tenant
  ON inmuebles (tenant_id, referencia)
  WHERE referencia IS NOT NULL;
