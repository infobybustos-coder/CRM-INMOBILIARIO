-- =====================================================================
-- ESQUEMA POSTGRESQL — CRM INMOBILIARIO (MVP, SIN IA)
-- Dos experiencias: Asesor (solo) e Inmobiliaria (equipo)
-- Mercado: España y Latinoamérica (pan-hispano)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";   -- mapa / geolocalización (fase 2, pero columnas listas ya)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- búsqueda fuzzy (nombres, direcciones)

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

-- Tipo de plan: define qué experiencia (UI) carga el tenant
CREATE TYPE tipo_plan AS ENUM ('asesor', 'inmobiliaria');

-- En plan "asesor" solo existe un usuario con rol implícito de propietario de cuenta.
-- En plan "inmobiliaria" se usan los 4 roles siguientes.
CREATE TYPE rol_usuario AS ENUM
  ('administrador', 'director_comercial', 'agente', 'captador');

CREATE TYPE estado_propietario AS ENUM
  ('nuevo_lead', 'contactado', 'tasacion_programada', 'tasacion_realizada',
   'negociacion', 'exclusiva_firmada', 'captado', 'perdido');

CREATE TYPE estado_comprador AS ENUM
  ('nuevo', 'cualificado', 'busqueda_activa', 'visitas',
   'oferta', 'reserva', 'comprado', 'perdido');

CREATE TYPE estado_inmueble AS ENUM
  ('captacion', 'preparacion', 'publicado', 'visitas',
   'oferta', 'reservado', 'vendido');

CREATE TYPE tipo_inmueble AS ENUM
  ('piso', 'casa', 'chalet', 'atico', 'duplex', 'local',
   'oficina', 'garaje', 'terreno', 'nave', 'otro');

CREATE TYPE tipo_financiacion AS ENUM
  ('hipoteca', 'contado', 'mixta', 'pendiente_estudio');

CREATE TYPE nivel_urgencia AS ENUM ('baja', 'media', 'alta');

CREATE TYPE estado_tarea AS ENUM
  ('pendiente', 'en_progreso', 'completada', 'cancelada');

CREATE TYPE tipo_documento AS ENUM
  ('dni', 'nota_simple', 'cert_energetico', 'ite', 'escritura',
   'cedula_habitabilidad', 'foto', 'plano', 'contrato', 'otro');

CREATE TYPE tipo_actividad AS ENUM
  ('nota', 'llamada', 'email', 'whatsapp', 'visita', 'tasacion',
   'cambio_estado', 'tarea_creada', 'tarea_completada', 'sistema');

CREATE TYPE plan_suscripcion AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE estado_suscripcion AS ENUM
  ('trial', 'activa', 'pausada', 'cancelada', 'impago');

-- País, para que el formato de moneda/teléfono/dirección se adapte
-- (lista corta de ejemplo — se ampliará según mercados objetivo reales)
CREATE TYPE pais_soportado AS ENUM
  ('ES', 'MX', 'CO', 'AR', 'CL', 'PE', 'EC', 'UY', 'PY', 'BO',
   'VE', 'GT', 'CR', 'PA', 'DO', 'OTRO');

-- =====================================================================
-- 2. NÚCLEO MULTI-TENANT
-- =====================================================================

CREATE TABLE tenants (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre              TEXT NOT NULL,            -- nombre de la inmobiliaria o del asesor
  slug                TEXT UNIQUE NOT NULL,
  tipo_plan           tipo_plan NOT NULL DEFAULT 'asesor',
  pais                pais_soportado NOT NULL DEFAULT 'ES',
  moneda              TEXT NOT NULL DEFAULT 'EUR',   -- 'EUR','MXN','COP','ARS','CLP', etc.
  logo_url            TEXT,
  color_marca         TEXT,
  zona_horaria        TEXT DEFAULT 'Europe/Madrid',
  plan                plan_suscripcion DEFAULT 'starter',
  activo              BOOLEAN DEFAULT TRUE,
  creado_en           TIMESTAMPTZ DEFAULT now(),
  actualizado_en      TIMESTAMPTZ DEFAULT now()
);

-- Perfil de usuario, vinculado 1:1 a auth.users de Supabase
CREATE TABLE usuarios (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre_completo     TEXT NOT NULL,
  email               TEXT NOT NULL,
  telefono            TEXT,
  rol                 rol_usuario NOT NULL DEFAULT 'agente',
  avatar_url          TEXT,
  activo              BOOLEAN DEFAULT TRUE,
  ultimo_acceso       TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_usuarios_tenant_email ON usuarios (tenant_id, email);
CREATE INDEX idx_usuarios_tenant ON usuarios (tenant_id);

-- Equipos: solo se usa cuando tenants.tipo_plan = 'inmobiliaria'
CREATE TABLE equipos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre              TEXT NOT NULL,
  director_id         UUID REFERENCES usuarios(id),
  creado_en           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE equipo_miembros (
  equipo_id           UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  PRIMARY KEY (equipo_id, usuario_id)
);

-- =====================================================================
-- 3. ZONAS (filtro geográfico simple — sin agregados de mercado todavía)
-- =====================================================================

CREATE TABLE zonas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre              TEXT NOT NULL,
  ciudad              TEXT,
  provincia_estado    TEXT,           -- "provincia" en España, "estado/departamento" en LatAm
  codigo_postal       TEXT,
  ubicacion           GEOGRAPHY(POINT),
  creado_en           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_zonas_tenant ON zonas (tenant_id);

-- =====================================================================
-- 4. MÓDULO PROPIETARIOS
-- =====================================================================

CREATE TABLE propietarios (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agente_id           UUID REFERENCES usuarios(id),
  nombre              TEXT NOT NULL,
  telefono            TEXT,            -- formato libre, se valida en frontend según país del tenant
  whatsapp            TEXT,
  email               TEXT,
  direccion           TEXT,
  ubicacion           GEOGRAPHY(POINT),
  zona_id             UUID REFERENCES zonas(id),
  tipo_inmueble       tipo_inmueble,
  estado              estado_propietario NOT NULL DEFAULT 'nuevo_lead',
  valor_estimado      NUMERIC(14,2),    -- precisión amplia para monedas con más dígitos (COP, etc.)
  fecha_ultimo_contacto TIMESTAMPTZ,
  fecha_proxima_accion  TIMESTAMPTZ,
  notas               TEXT,
  perdido_motivo      TEXT,
  creado_en           TIMESTAMPTZ DEFAULT now(),
  actualizado_en      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_propietarios_tenant ON propietarios (tenant_id);
CREATE INDEX idx_propietarios_estado ON propietarios (tenant_id, estado);
CREATE INDEX idx_propietarios_agente ON propietarios (agente_id);
CREATE INDEX idx_propietarios_zona ON propietarios (zona_id);
CREATE INDEX idx_propietarios_ultimo_contacto ON propietarios (fecha_ultimo_contacto);
CREATE INDEX idx_propietarios_nombre_trgm ON propietarios USING gin (nombre gin_trgm_ops);

-- =====================================================================
-- 5. MÓDULO COMPRADORES
-- =====================================================================

CREATE TABLE compradores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agente_id           UUID REFERENCES usuarios(id),
  nombre              TEXT NOT NULL,
  telefono            TEXT,
  email               TEXT,
  presupuesto_min     NUMERIC(14,2),
  presupuesto_max     NUMERIC(14,2),
  financiacion        tipo_financiacion,
  tipo_inmueble       tipo_inmueble,
  zona_buscada_id     UUID REFERENCES zonas(id),
  urgencia            nivel_urgencia DEFAULT 'media',
  estado              estado_comprador NOT NULL DEFAULT 'nuevo',
  fecha_ultimo_contacto TIMESTAMPTZ,
  fecha_proxima_accion  TIMESTAMPTZ,
  notas               TEXT,
  creado_en           TIMESTAMPTZ DEFAULT now(),
  actualizado_en      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_compradores_tenant ON compradores (tenant_id);
CREATE INDEX idx_compradores_estado ON compradores (tenant_id, estado);
CREATE INDEX idx_compradores_agente ON compradores (agente_id);
CREATE INDEX idx_compradores_zona ON compradores (zona_buscada_id);

-- =====================================================================
-- 6. MÓDULO INMUEBLES
-- =====================================================================

CREATE TABLE inmuebles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  propietario_id      UUID REFERENCES propietarios(id) ON DELETE SET NULL,
  agente_id           UUID REFERENCES usuarios(id),
  direccion           TEXT NOT NULL,
  ubicacion           GEOGRAPHY(POINT),
  zona_id             UUID REFERENCES zonas(id),
  precio              NUMERIC(14,2),
  metros_cuadrados    NUMERIC(8,2),
  habitaciones        SMALLINT,
  banos               SMALLINT,
  tipo                tipo_inmueble,
  estado              estado_inmueble NOT NULL DEFAULT 'captacion',
  certificado_energetico TEXT,
  descripcion         TEXT,
  fecha_publicacion   TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ DEFAULT now(),
  actualizado_en      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inmuebles_tenant ON inmuebles (tenant_id);
CREATE INDEX idx_inmuebles_estado ON inmuebles (tenant_id, estado);
CREATE INDEX idx_inmuebles_propietario ON inmuebles (propietario_id);
CREATE INDEX idx_inmuebles_zona ON inmuebles (zona_id);
CREATE INDEX idx_inmuebles_precio ON inmuebles (precio);

CREATE TABLE inmueble_fotos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inmueble_id         UUID NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
  url                 TEXT NOT NULL,
  orden               SMALLINT DEFAULT 0,
  creado_en           TIMESTAMPTZ DEFAULT now()
);

-- Vínculo manual comprador <-> inmueble (sin scoring de IA por ahora,
-- simplemente "este comprador está interesado en este inmueble")
CREATE TABLE inmueble_compradores_interesados (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inmueble_id         UUID NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
  comprador_id        UUID NOT NULL REFERENCES compradores(id) ON DELETE CASCADE,
  estado_interes      TEXT DEFAULT 'interesado',  -- interesado | visitado | descartado
  creado_en           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (inmueble_id, comprador_id)
);

CREATE INDEX idx_interes_inmueble ON inmueble_compradores_interesados (inmueble_id);
CREATE INDEX idx_interes_comprador ON inmueble_compradores_interesados (comprador_id);

-- =====================================================================
-- 7. DOCUMENTOS (polimórfico: propietario, comprador o inmueble)
-- =====================================================================

CREATE TABLE documentos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entidad_tipo        TEXT NOT NULL CHECK (entidad_tipo IN ('propietario','comprador','inmueble')),
  entidad_id          UUID NOT NULL,
  tipo_documento      tipo_documento,
  nombre_archivo      TEXT NOT NULL,
  url_storage         TEXT NOT NULL,
  subido_por          UUID REFERENCES usuarios(id),
  creado_en           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documentos_entidad ON documentos (entidad_tipo, entidad_id);
CREATE INDEX idx_documentos_tenant ON documentos (tenant_id);

-- =====================================================================
-- 8. ACTIVIDADES / TIMELINE (notas, llamadas, visitas — sin resumen IA)
-- =====================================================================

CREATE TABLE actividades (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entidad_tipo        TEXT NOT NULL CHECK (entidad_tipo IN ('propietario','comprador','inmueble')),
  entidad_id          UUID NOT NULL,
  usuario_id          UUID REFERENCES usuarios(id),
  tipo                tipo_actividad NOT NULL,
  contenido           TEXT,
  creado_en           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_actividades_entidad ON actividades (entidad_tipo, entidad_id, creado_en DESC);
CREATE INDEX idx_actividades_tenant ON actividades (tenant_id);

-- =====================================================================
-- 9. TAREAS (manuales por ahora — sin automatizaciones todavía)
-- =====================================================================

CREATE TABLE tareas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entidad_tipo        TEXT CHECK (entidad_tipo IN ('propietario','comprador','inmueble')),
  entidad_id          UUID,
  asignado_a          UUID REFERENCES usuarios(id),
  titulo              TEXT NOT NULL,
  descripcion         TEXT,
  fecha_vencimiento   TIMESTAMPTZ,
  estado              estado_tarea NOT NULL DEFAULT 'pendiente',
  creado_en           TIMESTAMPTZ DEFAULT now(),
  completada_en       TIMESTAMPTZ
);

CREATE INDEX idx_tareas_tenant ON tareas (tenant_id);
CREATE INDEX idx_tareas_asignado ON tareas (asignado_a, estado);
CREATE INDEX idx_tareas_vencimiento ON tareas (fecha_vencimiento);
CREATE INDEX idx_tareas_entidad ON tareas (entidad_tipo, entidad_id);

-- =====================================================================
-- 10. SUSCRIPCIONES (de la inmobiliaria/asesor a TU SaaS) Y FACTURACIÓN
-- =====================================================================

CREATE TABLE suscripciones (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  plan                plan_suscripcion NOT NULL DEFAULT 'starter',
  estado              estado_suscripcion NOT NULL DEFAULT 'trial',
  limite_usuarios     INTEGER,          -- 1 para plan 'asesor', N para 'inmobiliaria'
  fecha_inicio        TIMESTAMPTZ,
  fecha_renovacion    TIMESTAMPTZ,
  fecha_cancelacion   TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 11. AUDITORÍA / LOGS
-- =====================================================================

CREATE TABLE audit_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id          UUID REFERENCES usuarios(id),
  accion              TEXT NOT NULL,
  entidad_tipo        TEXT,
  entidad_id          UUID,
  cambios             JSONB,
  ip_origen           INET,
  creado_en           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_tenant ON audit_logs (tenant_id, creado_en DESC);

-- =====================================================================
-- 12. ROW LEVEL SECURITY — AISLAMIENTO MULTI-TENANT
-- =====================================================================

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_rol() RETURNS rol_usuario AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE propietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE compradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inmuebles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_propietarios ON propietarios USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_compradores ON compradores USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_inmuebles ON inmuebles USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_tareas ON tareas USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_documentos ON documentos USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_actividades ON actividades USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_zonas ON zonas USING (tenant_id = current_tenant_id());

-- En plan 'asesor' solo hay un usuario por tenant, así que esta política
-- de "ver solo lo mío" no aplica (es irrelevante con 1 sola persona).
-- En plan 'inmobiliaria' sí filtra por agente, salvo roles de gestión.
CREATE POLICY agente_solo_sus_propietarios ON propietarios
  FOR SELECT
  USING (
    current_user_rol() IN ('administrador', 'director_comercial')
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );

CREATE POLICY agente_solo_sus_compradores ON compradores
  FOR SELECT
  USING (
    current_user_rol() IN ('administrador', 'director_comercial')
    OR agente_id = auth.uid()
    OR (SELECT tipo_plan FROM tenants WHERE id = tenant_id) = 'asesor'
  );

-- =====================================================================
-- 13. TRIGGERS DE UTILIDAD
-- =====================================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_propietarios_updated BEFORE UPDATE ON propietarios
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_compradores_updated BEFORE UPDATE ON compradores
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trg_inmuebles_updated BEFORE UPDATE ON inmuebles
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- =====================================================================
-- NOTA SOBRE FASE 2 (IA)
-- =====================================================================
-- Las tablas de Radar de Captación, Centro de Oportunidades, Scoring,
-- Automatizaciones y Mercado (con análisis IA) NO están en este esquema
-- a propósito, porque el MVP actual no las necesita.
-- Ya están completamente diseñadas en el archivo "schema.sql" original
-- (el de la arquitectura completa con IA) que conservas de una versión
-- anterior — cuando decidas activar la IA, se añaden esas tablas sin
-- tener que rediseñar nada de lo que ya existe aquí.
-- =====================================================================
