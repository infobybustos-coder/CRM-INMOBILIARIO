-- =====================================================================
-- 0016 — Prioridad en tareas + historial/comentarios del módulo Tareas
-- =====================================================================
-- El módulo Tareas (panel de inmobiliaria) necesita un nivel de prioridad
-- por tarea y poder registrar comentarios internos e historial de cambios
-- reutilizando la tabla "actividades" ya existente.
-- =====================================================================

ALTER TABLE tareas ADD COLUMN IF NOT EXISTS prioridad nivel_urgencia NOT NULL DEFAULT 'media';

ALTER TABLE actividades DROP CONSTRAINT IF EXISTS actividades_entidad_tipo_check;
ALTER TABLE actividades ADD CONSTRAINT actividades_entidad_tipo_check
  CHECK (entidad_tipo IN ('propietario', 'comprador', 'inmueble', 'tarea'));
