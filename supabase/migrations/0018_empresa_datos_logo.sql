-- =====================================================================
-- 0018 — Datos de contacto de la empresa + bucket de logos
-- =====================================================================
-- El módulo Configuración > Empresa necesita CIF/NIF, teléfono, email,
-- dirección y web propios (distintos de los del usuario). El logo se
-- sube a un bucket público, en una carpeta por tenant.
-- =====================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cif_nif TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS web TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY logos_select_publico ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY logos_insert_admin ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
    AND current_user_rol() = 'admin'
  );

CREATE POLICY logos_update_admin ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
    AND current_user_rol() = 'admin'
  );

CREATE POLICY logos_delete_admin ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = current_tenant_id()::text
    AND current_user_rol() = 'admin'
  );
