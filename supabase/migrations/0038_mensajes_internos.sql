-- =====================================================================
-- 0038 — Mensajes: mensajería interna entre miembros de una inmobiliaria
-- (V1: conversaciones privadas 1:1, opcionalmente vinculadas a un
-- elemento del CRM). Sin políticas RLS en las tablas: todo el acceso
-- pasa por Server Actions con el rol de servicio, escopado a mano
-- comprobando la participación en conversaciones_participantes — mismo
-- patrón que pedidos/conversaciones/correos en este proyecto.
-- conversaciones_participantes admite ya varias filas por conversación
-- para no tener que migrar nada cuando se añadan chats de grupo.
-- =====================================================================

CREATE TABLE conversaciones_internas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL DEFAULT 'privada' CHECK (tipo IN ('privada')),
  entidad_tipo   TEXT CHECK (entidad_tipo IN ('inmueble','propietario','comprador','visita','tarea')),
  entidad_id     UUID,
  creado_por     UUID NOT NULL REFERENCES usuarios(id),
  creado_en      TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_conv_internas_tenant ON conversaciones_internas (tenant_id);

CREATE TABLE conversaciones_participantes (
  conversacion_id UUID NOT NULL REFERENCES conversaciones_internas(id) ON DELETE CASCADE,
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ultima_lectura  TIMESTAMPTZ,
  unido_en        TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversacion_id, usuario_id)
);
CREATE INDEX idx_conv_participantes_usuario ON conversaciones_participantes (usuario_id);

CREATE TABLE mensajes_internos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversacion_id UUID NOT NULL REFERENCES conversaciones_internas(id) ON DELETE CASCADE,
  autor_id        UUID NOT NULL REFERENCES usuarios(id),
  contenido       TEXT,
  creado_en       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_mensajes_internos_conv ON mensajes_internos (conversacion_id, creado_en);

CREATE TABLE adjuntos_mensaje_interno (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mensaje_id     UUID NOT NULL REFERENCES mensajes_internos(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  url_storage    TEXT NOT NULL,
  tipo_mime      TEXT,
  tamano_bytes   INTEGER,
  creado_en      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_adjuntos_mensaje_interno ON adjuntos_mensaje_interno (mensaje_id);

-- Elemento del CRM compartido dentro de un mensaje (tarjeta inline,
-- distinta de la entidad fijada en la cabecera de la conversación).
CREATE TABLE tarjetas_mensaje (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mensaje_id   UUID NOT NULL REFERENCES mensajes_internos(id) ON DELETE CASCADE,
  entidad_tipo TEXT NOT NULL CHECK (entidad_tipo IN ('inmueble','propietario','comprador','visita','tarea')),
  entidad_id   UUID NOT NULL,
  creado_en    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tarjetas_mensaje ON tarjetas_mensaje (mensaje_id);

ALTER TABLE conversaciones_internas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversaciones_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjuntos_mensaje_interno ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas_mensaje ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('adjuntos_internos', 'adjuntos_internos', false)
ON CONFLICT (id) DO NOTHING;

-- La subida es siempre cliente-a-Storage con la anon key (mismo patrón
-- que adjuntos_soporte/documentos), así que aquí sí hacen falta
-- políticas reales: solo un participante de la conversación puede leer
-- o subir adjuntos de esa carpeta.
CREATE POLICY adjuntos_internos_select ON storage.objects FOR SELECT USING (
  bucket_id = 'adjuntos_internos' AND EXISTS (
    SELECT 1 FROM conversaciones_participantes cp
    WHERE cp.conversacion_id::text = (storage.foldername(name))[1] AND cp.usuario_id = auth.uid()
  )
);
CREATE POLICY adjuntos_internos_insert ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'adjuntos_internos' AND EXISTS (
    SELECT 1 FROM conversaciones_participantes cp
    WHERE cp.conversacion_id::text = (storage.foldername(name))[1] AND cp.usuario_id = auth.uid()
  )
);
