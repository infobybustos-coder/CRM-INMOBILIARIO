-- =====================================================================
-- 0008 — Perfil de usuario (bio, idioma, moneda), permiso de
-- autoedición y chat interno de soporte técnico.
-- =====================================================================

ALTER TABLE usuarios
  ADD COLUMN bio     TEXT,
  ADD COLUMN idioma  TEXT NOT NULL DEFAULT 'es' CHECK (idioma IN ('es', 'en')),
  ADD COLUMN moneda  TEXT NOT NULL DEFAULT 'EUR' CHECK (moneda IN ('EUR', 'USD'));

CREATE POLICY usuarios_update_propio ON usuarios
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Chat de soporte técnico: mensajes entre el asesor y el equipo de soporte.
CREATE TYPE remitente_soporte AS ENUM ('asesor', 'soporte');

CREATE TABLE mensajes_soporte (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  remitente   remitente_soporte NOT NULL DEFAULT 'asesor',
  contenido   TEXT NOT NULL,
  creado_en   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mensajes_soporte_usuario ON mensajes_soporte (usuario_id, creado_en);

ALTER TABLE mensajes_soporte ENABLE ROW LEVEL SECURITY;

CREATE POLICY mensajes_soporte_propio ON mensajes_soporte
  FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Bucket público para fotos de perfil (cada usuario solo escribe en su carpeta).
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatares', 'avatares', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY avatares_select_publico ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatares');

CREATE POLICY avatares_insert_propio ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatares_update_propio ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatares_delete_propio ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
