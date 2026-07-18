-- =====================================================================
-- 0041 — Módulo "Colaboraciones": personas que recomiendan Ambraio con
-- código/enlace de referido propio y un panel privado con sus
-- estadísticas. Sin sistema de pagos/comisiones todavía — solo la base
-- para poder añadirlo más adelante sin tocar este esquema.
--
-- Los colaboradores son cuentas de plataforma (como superadmins), NO
-- vinculadas a un tenant — igual que superadmins no vive en "usuarios".
--
-- Las estadísticas (registros, Free/Pro, conversión...) NO se guardan
-- en una columna aparte: se calculan al vuelo haciendo JOIN entre
-- colaborador_referidos y tenants en cada carga de página. Así, cuando
-- un tenant cambia de plan_tarifa o estado (upgrade, cancelación...),
-- las estadísticas del colaborador quedan al día automáticamente sin
-- necesidad de triggers ni de tocar ninguno de los sitios del código
-- que ya actualizan tenants.plan_tarifa/estado.
-- =====================================================================

CREATE TABLE colaboradores (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  codigo_referido TEXT NOT NULL UNIQUE,
  estado          TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  creado_en       TIMESTAMPTZ DEFAULT now(),
  actualizado_en  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_colaboradores_codigo ON colaboradores (codigo_referido);

-- Una fila por tenant referido: la relación es permanente (un tenant
-- solo puede haber sido referido por un colaborador, para siempre).
CREATE TABLE colaborador_referidos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  codigo_usado   TEXT NOT NULL,
  creado_en      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_colaborador_referidos_colaborador ON colaborador_referidos (colaborador_id);

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaborador_referidos ENABLE ROW LEVEL SECURITY;
-- Sin políticas: todo el acceso pasa por Server Actions con el rol de servicio.

INSERT INTO plantillas_email (clave, nombre, descripcion, asunto, contenido_html, boton_texto, boton_url, variables_disponibles, activo) VALUES
('bienvenida_colaborador', 'Bienvenida a colaborador', 'Se envía cuando el superadmin da de alta a un nuevo colaborador, con un enlace para que configure su contraseña y pueda entrar a su panel.',
'¡Bienvenido/a al programa de Colaboraciones de Ambraio, {{nombre}}!',
'<p>Hola {{nombre}},</p>
<p>Te hemos dado de alta como colaborador de Ambraio. Tu código de referido es <strong>{{codigo}}</strong> — compártelo con quien quieras y sigue todos tus registros y estadísticas desde tu panel privado.</p>
<p>Pulsa el botón de abajo para poner tu contraseña y entrar por primera vez.</p>',
'Configurar mi contraseña', '{{enlace}}',
ARRAY['nombre','codigo','enlace'], true);
