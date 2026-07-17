-- Registro de todos los intentos de envío de correo (automáticos y
-- reenvíos manuales desde superadmin), para poder ver qué salió, qué
-- falló, y reenviar uno concreto si no llegó.
CREATE TABLE correos_enviados (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plantilla_clave TEXT NOT NULL,
  destinatario    TEXT NOT NULL,
  asunto          TEXT NOT NULL,
  variables       JSONB NOT NULL DEFAULT '{}',
  estado          TEXT NOT NULL DEFAULT 'enviado' CHECK (estado IN ('enviado', 'fallido', 'omitido')),
  error           TEXT,
  es_reenvio      BOOLEAN NOT NULL DEFAULT false,
  reenviado_por   TEXT,
  creado_en       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_correos_enviados_creado ON correos_enviados (creado_en DESC);
CREATE INDEX idx_correos_enviados_destinatario ON correos_enviados (destinatario);

ALTER TABLE correos_enviados ENABLE ROW LEVEL SECURITY;
-- Sin políticas: todo el acceso pasa por Server Actions con el rol de servicio.
