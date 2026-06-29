-- =====================================================================
-- 0005 — Bucket de Storage para documentos (DNI, nota simple, etc.)
-- Estructura de carpetas: {tenant_id}/{entidad_tipo}/{entidad_id}/{archivo}
-- Así cada inquilino solo puede ver/subir/borrar sus propios archivos.
-- =====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY documentos_select_propio ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );

CREATE POLICY documentos_insert_propio ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );

CREATE POLICY documentos_delete_propio ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
  );
