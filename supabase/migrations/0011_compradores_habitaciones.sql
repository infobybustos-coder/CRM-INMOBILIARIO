-- 0011 — Añade habitaciones buscadas a compradores
ALTER TABLE compradores
  ADD COLUMN IF NOT EXISTS habitaciones INTEGER;
