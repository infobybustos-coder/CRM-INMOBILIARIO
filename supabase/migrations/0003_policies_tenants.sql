-- =====================================================================
-- 0003 — RLS faltante en `tenants`
-- El schema_mvp.sql original no activa RLS en `tenants`, pero el panel
-- de Supabase puede haberla activado manualmente sin política, lo que
-- bloquea la lectura del propio tenant (incluso para su dueño).
-- =====================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_select_propio ON tenants
  FOR SELECT
  USING (id = current_tenant_id());
