-- =====================================================================
-- 0034 — Contador de visitas a la landing pública, por día y por
-- dominio. El dominio se toma del header "host" de cada visita, así
-- que si el dominio cambia (dominio provisional de Vercel, dominio
-- propio, etc.) el contador sigue funcionando solo, sin tocar nada:
-- simplemente empieza a acumular bajo el nuevo dominio.
-- =====================================================================

CREATE TABLE IF NOT EXISTS landing_visitas (
  fecha    DATE NOT NULL,
  dominio  TEXT NOT NULL,
  visitas  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (fecha, dominio)
);

CREATE INDEX IF NOT EXISTS idx_landing_visitas_fecha ON landing_visitas (fecha);

ALTER TABLE landing_visitas ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo se lee/escribe con el rol de servicio, desde la
-- propia landing (para contar) y desde el panel de superadmin (para verlo).

CREATE OR REPLACE FUNCTION incrementar_visita_landing(p_dominio TEXT)
RETURNS void AS $$
  INSERT INTO landing_visitas (fecha, dominio, visitas)
  VALUES (CURRENT_DATE, p_dominio, 1)
  ON CONFLICT (fecha, dominio)
  DO UPDATE SET visitas = landing_visitas.visitas + 1;
$$ LANGUAGE sql;
