-- =====================================================================
-- 0035 — Centro de ayuda: sistema de conversaciones de soporte nativo
-- (sustituye al chat unidireccional "mensajes_soporte", que se queda sin
-- usar pero no se borra). Conversaciones con estado, mensajes y
-- adjuntos, preparado para asignación de agente/prioridad/notas
-- internas en el futuro sin tener que tocar el esquema otra vez.
--
-- Mismo patrón de RLS que pedidos/tenant_eventos/landing_visitas: RLS
-- activado sin políticas — todo el acceso (incluidas las páginas del
-- propio cliente) pasa por Server Actions con el rol de servicio,
-- escopado a mano por creado_por/tenant_id en el código.
-- =====================================================================

CREATE TABLE conversaciones (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id              UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  -- Referencia a usuarios (no auth.users): solo un cliente real (con fila
  -- en usuarios) puede crear una conversación, nunca un superadmin. Así
  -- se puede unir directamente con usuarios/tenants en el panel de soporte.
  creado_por             UUID NOT NULL REFERENCES usuarios (id),
  asunto                 TEXT NOT NULL,
  estado                 TEXT NOT NULL DEFAULT 'abierta'
                         CHECK (estado IN ('abierta', 'en_proceso', 'esperando_respuesta', 'resuelta')),
  -- Preparado para V2, sin usar todavía por ninguna pantalla:
  asignado_a             UUID REFERENCES auth.users (id),
  prioridad              TEXT,
  ultima_lectura_cliente TIMESTAMPTZ,
  ultima_lectura_soporte TIMESTAMPTZ,
  creado_en              TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversaciones_creado_por ON conversaciones (creado_por);
CREATE INDEX idx_conversaciones_tenant ON conversaciones (tenant_id);
CREATE INDEX idx_conversaciones_estado ON conversaciones (estado);

CREATE TABLE mensajes_conversacion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id UUID NOT NULL REFERENCES conversaciones (id) ON DELETE CASCADE,
  autor_id        UUID NOT NULL REFERENCES auth.users (id),
  autor_tipo      TEXT NOT NULL CHECK (autor_tipo IN ('cliente', 'soporte')),
  contenido       TEXT,
  es_nota_interna BOOLEAN NOT NULL DEFAULT false, -- preparado para V2 (notas del equipo, no visibles al cliente)
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mensajes_conversacion ON mensajes_conversacion (conversacion_id, creado_en);

CREATE TABLE adjuntos_conversacion (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mensaje_id     UUID NOT NULL REFERENCES mensajes_conversacion (id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  url_storage    TEXT NOT NULL,
  tipo_mime      TEXT,
  tamano_bytes   INTEGER,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_adjuntos_mensaje ON adjuntos_conversacion (mensaje_id);

ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_conversacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjuntos_conversacion ENABLE ROW LEVEL SECURITY;
-- Sin políticas: ver comentario de cabecera.

-- Bucket privado para adjuntos de soporte. Ruta: {conversacion_id}/{timestamp}_{nombre}.
INSERT INTO storage.buckets (id, name, public)
VALUES ('adjuntos_soporte', 'adjuntos_soporte', false)
ON CONFLICT (id) DO NOTHING;

-- El cliente dueño de la conversación puede leer/subir en su propia
-- carpeta, y cualquier superadmin puede leer/subir en cualquier
-- conversación (necesita responder con adjuntos desde el panel).
CREATE POLICY adjuntos_soporte_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'adjuntos_soporte'
    AND (
      EXISTS (
        SELECT 1 FROM conversaciones c
        WHERE c.id::text = (storage.foldername(name))[1]
          AND c.creado_por = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM superadmins s WHERE s.usuario_id = auth.uid())
    )
  );

CREATE POLICY adjuntos_soporte_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'adjuntos_soporte'
    AND (
      EXISTS (
        SELECT 1 FROM conversaciones c
        WHERE c.id::text = (storage.foldername(name))[1]
          AND c.creado_por = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM superadmins s WHERE s.usuario_id = auth.uid())
    )
  );
