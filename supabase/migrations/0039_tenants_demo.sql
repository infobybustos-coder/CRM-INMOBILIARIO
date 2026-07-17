-- Tenants de demostración usados por "Vista previa de interfaz" en superadmin:
-- no son clientes reales, se excluyen de todas las métricas de negocio.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS es_demo BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_tenants_es_demo ON tenants (es_demo) WHERE es_demo = true;
