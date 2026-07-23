-- =====================================================================
-- 0033 — Divisa de cada pedido, para que Finanzas pueda distinguir lo
-- cobrado en euros de lo cobrado en dólares (mismo importe numérico,
-- pasarelas separadas por país del visitante).
-- =====================================================================

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'EUR';
