-- =====================================================================
-- 0027 — Pedidos: registro real de cada intento de pago y de cada pago
-- confirmado. Sustituye el "cambio de plan instantáneo" por un flujo en
-- dos pasos: el cliente solicita el pago (pedido en estado "iniciado"),
-- y no obtiene el plan PRO hasta que el pago se confirma de verdad
-- (estado "pagado") — hoy esa confirmación la hace el superadmin a
-- mano porque no hay pasarela conectada; el día que la haya, será esa
-- pasarela la que confirme el pedido. "Cancelado" cubre los intentos
-- que no llegaron a completarse.
-- =====================================================================

CREATE TABLE IF NOT EXISTS pedidos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL DEFAULT 'plan_pro' CHECK (tipo IN ('plan_pro', 'ajuste_manual')),
  concepto       TEXT NOT NULL,
  importe        NUMERIC(10, 2) NOT NULL,
  metodo_pago    TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'iniciado' CHECK (estado IN ('iniciado', 'pagado', 'cancelado')),
  creado_en      TIMESTAMPTZ DEFAULT now(),
  confirmado_en  TIMESTAMPTZ,
  confirmado_por TEXT
);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo se lee/escribe con el rol de servicio, desde las
-- acciones del servidor (tanto del lado cliente como del superadmin).
