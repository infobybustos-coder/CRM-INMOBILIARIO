-- =====================================================================
-- 0002 — RLS faltante en `usuarios`
-- El schema_mvp.sql original activa RLS en `usuarios` pero no define
-- ninguna política, lo que bloquea cualquier lectura (incluso la propia
-- fila) para un usuario autenticado normal. La creación de tenant/usuario
-- en el signup se hace con la service role key (que ignora RLS), así que
-- aquí solo cubrimos lectura.
-- =====================================================================

CREATE POLICY usuarios_select_propio ON usuarios
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY usuarios_select_mismo_tenant ON usuarios
  FOR SELECT
  USING (tenant_id = current_tenant_id());
