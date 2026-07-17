-- =====================================================================
-- 0037 — Módulo "Correos": plantillas de email editables desde el
-- superadmin (asunto, contenido, botón, variables, activo/inactivo),
-- marca compartida de todos los correos (color, logo, firma, remitente),
-- y deduplicación de avisos de límite de plan por tenant/recurso/umbral.
-- Sin políticas RLS: todo el acceso pasa por Server Actions con el rol
-- de servicio (mismo patrón que pedidos/conversaciones/landing_config).
-- =====================================================================

CREATE TABLE plantillas_email (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave                  TEXT UNIQUE NOT NULL,
  nombre                 TEXT NOT NULL,
  descripcion            TEXT,
  asunto                 TEXT NOT NULL,
  contenido_html         TEXT NOT NULL,
  boton_texto            TEXT,
  boton_url              TEXT,
  variables_disponibles  TEXT[] NOT NULL DEFAULT '{}',
  activo                 BOOLEAN NOT NULL DEFAULT true,
  creado_en              TIMESTAMPTZ DEFAULT now(),
  actualizado_en         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE config_correos (
  id                INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  color_principal   TEXT NOT NULL DEFAULT '#7c2d3a',
  logo_url          TEXT,
  firma             TEXT NOT NULL DEFAULT 'El equipo de Ambraio',
  remitente_nombre  TEXT NOT NULL DEFAULT 'Ambraio',
  remitente_email   TEXT NOT NULL DEFAULT 'hola@ambraio.com',
  actualizado_en    TIMESTAMPTZ DEFAULT now()
);
INSERT INTO config_correos (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE avisos_limite_enviados (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recurso     TEXT NOT NULL,
  umbral      INTEGER NOT NULL,
  enviado_en  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, recurso, umbral)
);
CREATE INDEX idx_avisos_limite_tenant ON avisos_limite_enviados (tenant_id);

ALTER TABLE plantillas_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_correos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos_limite_enviados ENABLE ROW LEVEL SECURITY;

INSERT INTO plantillas_email (clave, nombre, descripcion, asunto, contenido_html, boton_texto, boton_url, variables_disponibles, activo) VALUES

('bienvenida', 'Bienvenida', 'Se envía automáticamente justo después de que un usuario se registre.',
'¡Bienvenido/a a Ambraio, {{nombre}}!',
'<p>Hola {{nombre}},</p>
<p>Tu cuenta de <strong>{{empresa}}</strong> ya está lista. Ambraio te va a ayudar a organizar tus propietarios, inmuebles, compradores y visitas en un único sitio.</p>
<p>Para empezar, te recomendamos:</p>
<ul>
  <li>Dar de alta tu primer propietario o inmueble.</li>
  <li>Completar los datos de tu empresa en Ajustes.</li>
  <li>Echar un vistazo a tu panel de control, donde verás de un vistazo lo que necesita tu atención hoy.</li>
</ul>
<p>Si tienes cualquier duda, escríbenos desde el Centro de ayuda dentro de la app.</p>',
'Entrar a mi panel', '{{app_url}}',
ARRAY['nombre','empresa','email','app_url'], true),

('limite_aviso', 'Aviso de límite del plan gratuito', 'Se envía cuando un tenant supera el 80% o el 90% de un límite de su plan Gratis.',
'Estás cerca del límite de tu plan Gratis',
'<p>Hola {{nombre}},</p>
<p>Tu cuenta de <strong>{{empresa}}</strong> ha usado ya el <strong>{{porcentaje}}%</strong> de tu límite de {{recurso}} en el Plan Gratis.</p>
<p>Cuando llegues al límite no podrás añadir más {{recurso}} hasta que actualices tu plan. Con Ambraio PRO tendrás {{recurso}} ilimitados, además de más funciones para tu equipo.</p>',
'Mejorar a PRO', '{{app_url}}/asesor/ajustes',
ARRAY['nombre','empresa','recurso','porcentaje','app_url'], true),

('limite_alcanzado', 'Límite alcanzado', 'Se envía cuando un tenant alcanza el límite permitido de su plan Gratis.',
'Has llegado al límite de tu plan Gratis',
'<p>Hola {{nombre}},</p>
<p>Tu cuenta de <strong>{{empresa}}</strong> ha alcanzado el límite de {{recurso}} incluido en el Plan Gratis.</p>
<p>Para seguir añadiendo {{recurso}} y desbloquear el resto de funciones, actualiza a Ambraio PRO cuando quieras — se hace en un par de clics desde tu panel.</p>',
'Mejorar a PRO', '{{app_url}}/asesor/ajustes',
ARRAY['nombre','empresa','recurso','app_url'], true),

('recuperar_password', 'Recuperación de contraseña', 'Se envía cuando un usuario solicita restablecer su contraseña (o cuando lo hace soporte en su nombre).',
'Restablece tu contraseña de Ambraio',
'<p>Hola {{nombre}},</p>
<p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de Ambraio. Pulsa el botón de abajo para elegir una nueva contraseña.</p>
<p>Si no has sido tú quien lo ha pedido, puedes ignorar este correo — tu contraseña actual seguirá funcionando.</p>',
'Cambiar mi contraseña', '{{enlace}}',
ARRAY['nombre','email','enlace'], true),

('password_cambiada', 'Contraseña cambiada', 'Correo de seguridad enviado justo después de que un usuario cambie su contraseña correctamente.',
'Tu contraseña ha cambiado',
'<p>Hola {{nombre}},</p>
<p>Te confirmamos que la contraseña de tu cuenta ({{email}}) se cambió correctamente el {{fecha}}.</p>
<p>Si no has sido tú, contacta cuanto antes con nuestro equipo de soporte desde el Centro de ayuda.</p>',
NULL, NULL,
ARRAY['nombre','email','fecha'], true),

('cambio_plan', 'Cambio de plan', 'Se envía cuando un tenant pasa de Plan Gratis a Plan Pro.',
'¡Ya tienes Ambraio PRO!',
'<p>Hola {{nombre}},</p>
<p>Tu cuenta de <strong>{{empresa}}</strong> ya está en el {{plan}}. Gracias por confiar en Ambraio.</p>
<p>A partir de ahora tienes acceso a todas las funciones PRO, sin límites en propietarios, inmuebles ni compradores.</p>',
'Ver mi panel', '{{app_url}}',
ARRAY['nombre','empresa','plan','app_url'], true),

('cancelacion_plan', 'Cancelación de suscripción', 'Se envía al confirmarse la cancelación de una suscripción Pro.',
'Tu suscripción de Ambraio se ha cancelado',
'<p>Hola {{nombre}},</p>
<p>Confirmamos que la suscripción PRO de <strong>{{empresa}}</strong> se ha cancelado el {{fecha}}.</p>
<p>Tu cuenta sigue activa en el Plan Gratis, con sus límites habituales — no perderás ningún dato. Puedes volver a PRO cuando quieras desde tu panel.</p>',
NULL, NULL,
ARRAY['nombre','empresa','fecha'], true),

('verificacion_email', 'Verificación de correo electrónico', 'No usada actualmente: el alta de cuenta se confirma automáticamente sin requerir verificación por email. Se deja creada y desactivada, lista para cuando se decida exigir verificación.',
'Confirma tu email en Ambraio',
'<p>Hola {{nombre}},</p>
<p>Para activar tu cuenta de Ambraio, confirma tu dirección de correo pulsando el botón de abajo.</p>',
'Confirmar mi email', '{{enlace}}',
ARRAY['nombre','enlace'], false);
