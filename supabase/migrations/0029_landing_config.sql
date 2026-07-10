-- =====================================================================
-- 0029 — Configuración de la landing pública (fila única): todo el
-- texto de la página de inicio (héroe, características, llamada a la
-- acción final) editable desde /superadmin/landing, sin tocar código.
-- Lectura pública (la landing la ve cualquier visitante sin sesión);
-- solo el rol de servicio puede escribir.
-- =====================================================================

CREATE TABLE IF NOT EXISTS landing_config (
  id                            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_titulo                   TEXT NOT NULL DEFAULT 'El CRM que tu inmobiliaria necesita para vender más, sin caos',
  hero_subtitulo                TEXT NOT NULL DEFAULT 'Gestiona propietarios, inmuebles, compradores y tu equipo desde un solo sitio. Empieza gratis, sin tarjeta de crédito.',
  hero_cta_principal             TEXT NOT NULL DEFAULT 'Empieza gratis',
  hero_cta_secundario            TEXT NOT NULL DEFAULT 'Ver planes y precios',
  caracteristica_1_titulo       TEXT NOT NULL DEFAULT 'Todo en un solo lugar',
  caracteristica_1_descripcion  TEXT NOT NULL DEFAULT 'Propietarios, inmuebles, compradores y visitas organizados, sin hojas de cálculo ni WhatsApp perdido.',
  caracteristica_2_titulo       TEXT NOT NULL DEFAULT 'Trabaja en equipo',
  caracteristica_2_descripcion  TEXT NOT NULL DEFAULT 'Invita a tus asesores, reparte el trabajo y ve el rendimiento de cada uno en tiempo real.',
  caracteristica_3_titulo       TEXT NOT NULL DEFAULT 'Crece a tu ritmo',
  caracteristica_3_descripcion  TEXT NOT NULL DEFAULT 'Empieza gratis y pasa a PRO cuando lo necesites, sin límite de propietarios, inmuebles ni compradores.',
  cta_final_titulo              TEXT NOT NULL DEFAULT '¿Listo para ordenar tu negocio?',
  cta_final_subtitulo           TEXT NOT NULL DEFAULT 'Crea tu cuenta en menos de un minuto. Sin compromiso.',
  actualizado_en                TIMESTAMPTZ DEFAULT now()
);

INSERT INTO landing_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE landing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_config es de lectura pública"
  ON landing_config
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- Sin política de escritura: solo se actualiza con el rol de servicio
-- desde /superadmin/landing.
