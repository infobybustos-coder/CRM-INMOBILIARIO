-- =====================================================================
-- 0015 — Añade "reunion" como tipo de evento de agenda
-- =====================================================================
-- El módulo Agenda distingue Llamada, Visita, Tasación y Reunión.
-- "recordatorio" se conserva tal cual para el "Otro" genérico que ya
-- usa el panel de asesor (no es lo mismo que una reunión).
-- =====================================================================

ALTER TYPE tipo_evento_agenda ADD VALUE IF NOT EXISTS 'reunion';
