-- =====================================================================
-- 0026 — Histórico de MRR para la sección Finanzas del superadmin.
-- Una fila por día con el MRR calculado en ese momento; se va
-- guardando sola cada vez que alguien visita /superadmin/finanzas
-- (no hay pasarela de pago todavía, así que es un cálculo sobre los
-- planes activos, no facturación real). No hay datos anteriores a la
-- fecha en que se aplique esta migración.
-- =====================================================================

CREATE TABLE IF NOT EXISTS mrr_snapshots (
  fecha         DATE PRIMARY KEY,
  mrr           NUMERIC(10, 2) NOT NULL,
  clientes_pro  INTEGER NOT NULL,
  clientes_free INTEGER NOT NULL,
  creado_en     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mrr_snapshots ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo se lee/escribe con el rol de servicio, desde
-- las páginas del panel de superadmin.
