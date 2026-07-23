-- =====================================================================
-- 0017 — Asientos extra de equipo (agentes y administradores)
-- =====================================================================
-- El plan "inmobiliaria" incluye 2 agentes y 2 administradores. Cada
-- asiento adicional se cobra aparte (7,99€/mes por agente extra,
-- 9,99€/mes por administrador extra). Estas columnas cuentan cuántos
-- asientos extra ha añadido el tenant a su plan.
-- =====================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS agentes_extra INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admins_extra INTEGER NOT NULL DEFAULT 0;
