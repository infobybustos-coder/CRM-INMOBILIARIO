-- =====================================================================
-- 0030 — Amplía landing_config para que TODO el contenido de la
-- landing sea editable desde /superadmin/landing sin tocar código:
-- insignia, barra de confianza, tarjetas de acceso rápido, sección de
-- problemas, cuadrícula de módulos, "cómo funciona", cabeceras de la
-- sección de planes y preguntas frecuentes. Los iconos de cada bloque
-- siguen fijos por posición (no son editables, solo el texto).
-- =====================================================================

ALTER TABLE landing_config
  ADD COLUMN IF NOT EXISTS badge_texto TEXT NOT NULL DEFAULT 'Software de gestión inmobiliaria',

  ADD COLUMN IF NOT EXISTS trust_1 TEXT NOT NULL DEFAULT 'Gratis para siempre en el plan básico',
  ADD COLUMN IF NOT EXISTS trust_2 TEXT NOT NULL DEFAULT 'Sin tarjeta de crédito',
  ADD COLUMN IF NOT EXISTS trust_3 TEXT NOT NULL DEFAULT 'Cancela cuando quieras',

  ADD COLUMN IF NOT EXISTS quick_asesor_titulo TEXT NOT NULL DEFAULT 'Soy asesor independiente',
  ADD COLUMN IF NOT EXISTS quick_asesor_descripcion TEXT NOT NULL DEFAULT 'Trabajo por mi cuenta y gestiono mi propio negocio.',
  ADD COLUMN IF NOT EXISTS quick_inmobiliaria_titulo TEXT NOT NULL DEFAULT 'Tengo una inmobiliaria',
  ADD COLUMN IF NOT EXISTS quick_inmobiliaria_descripcion TEXT NOT NULL DEFAULT 'Tengo un equipo de asesores que coordinar.',

  ADD COLUMN IF NOT EXISTS problema_titulo TEXT NOT NULL DEFAULT '¿Te suena esto?',
  ADD COLUMN IF NOT EXISTS problema_1 TEXT NOT NULL DEFAULT 'Los datos de tus propietarios están repartidos entre WhatsApp, notas y hojas de cálculo.',
  ADD COLUMN IF NOT EXISTS problema_2 TEXT NOT NULL DEFAULT 'No sabes qué inmuebles siguen disponibles sin llamar a alguien de tu equipo.',
  ADD COLUMN IF NOT EXISTS problema_3 TEXT NOT NULL DEFAULT 'Se te escapan compradores porque nadie hizo seguimiento a tiempo.',
  ADD COLUMN IF NOT EXISTS problema_4 TEXT NOT NULL DEFAULT 'No tienes ni idea de cuánto está vendiendo cada asesor.',
  ADD COLUMN IF NOT EXISTS transicion_texto TEXT NOT NULL DEFAULT 'Con CRM Inmobiliario, todo eso desaparece.',

  ADD COLUMN IF NOT EXISTS modulo_titulo TEXT NOT NULL DEFAULT 'Todo lo que necesitas, en un solo sitio',
  ADD COLUMN IF NOT EXISTS modulo_subtitulo TEXT NOT NULL DEFAULT 'Nada de herramientas sueltas ni suscripciones cruzadas.',
  ADD COLUMN IF NOT EXISTS modulo_1_titulo TEXT NOT NULL DEFAULT 'Propietarios',
  ADD COLUMN IF NOT EXISTS modulo_1_descripcion TEXT NOT NULL DEFAULT 'Capta y organiza a tus propietarios sin perder ni un contacto.',
  ADD COLUMN IF NOT EXISTS modulo_2_titulo TEXT NOT NULL DEFAULT 'Inmuebles',
  ADD COLUMN IF NOT EXISTS modulo_2_descripcion TEXT NOT NULL DEFAULT 'Toda tu cartera en un mismo sitio, con el estado siempre al día.',
  ADD COLUMN IF NOT EXISTS modulo_3_titulo TEXT NOT NULL DEFAULT 'Compradores',
  ADD COLUMN IF NOT EXISTS modulo_3_descripcion TEXT NOT NULL DEFAULT 'Haz seguimiento y no dejes escapar ninguna oportunidad.',
  ADD COLUMN IF NOT EXISTS modulo_4_titulo TEXT NOT NULL DEFAULT 'Visitas y agenda',
  ADD COLUMN IF NOT EXISTS modulo_4_descripcion TEXT NOT NULL DEFAULT 'Planifica visitas y tareas sin depender de la memoria.',
  ADD COLUMN IF NOT EXISTS modulo_5_titulo TEXT NOT NULL DEFAULT 'Equipo',
  ADD COLUMN IF NOT EXISTS modulo_5_descripcion TEXT NOT NULL DEFAULT 'Reparte el trabajo entre tus asesores y ve quién rinde más.',
  ADD COLUMN IF NOT EXISTS modulo_6_titulo TEXT NOT NULL DEFAULT 'Rendimiento',
  ADD COLUMN IF NOT EXISTS modulo_6_descripcion TEXT NOT NULL DEFAULT 'Métricas claras de tu negocio, sin montar una hoja de cálculo.',

  ADD COLUMN IF NOT EXISTS pasos_titulo TEXT NOT NULL DEFAULT 'Empieza en tres pasos',
  ADD COLUMN IF NOT EXISTS paso_1_titulo TEXT NOT NULL DEFAULT 'Crea tu cuenta gratis',
  ADD COLUMN IF NOT EXISTS paso_1_descripcion TEXT NOT NULL DEFAULT 'Sin tarjeta de crédito, en menos de un minuto.',
  ADD COLUMN IF NOT EXISTS paso_2_titulo TEXT NOT NULL DEFAULT 'Añade tu cartera',
  ADD COLUMN IF NOT EXISTS paso_2_descripcion TEXT NOT NULL DEFAULT 'Propietarios, inmuebles y compradores, todo en su sitio.',
  ADD COLUMN IF NOT EXISTS paso_3_titulo TEXT NOT NULL DEFAULT 'Vende con orden',
  ADD COLUMN IF NOT EXISTS paso_3_descripcion TEXT NOT NULL DEFAULT 'Haz seguimiento, reparte tareas y cierra más operaciones.',

  ADD COLUMN IF NOT EXISTS planes_titulo TEXT NOT NULL DEFAULT 'Planes claros, sin sorpresas',
  ADD COLUMN IF NOT EXISTS planes_subtitulo TEXT NOT NULL DEFAULT 'Empieza gratis. Sin permanencia — cambia o cancela cuando quieras.',

  ADD COLUMN IF NOT EXISTS faq_titulo TEXT NOT NULL DEFAULT 'Preguntas frecuentes',
  ADD COLUMN IF NOT EXISTS faq_1_pregunta TEXT NOT NULL DEFAULT '¿Necesito tarjeta de crédito para empezar?',
  ADD COLUMN IF NOT EXISTS faq_1_respuesta TEXT NOT NULL DEFAULT 'No. El plan Gratis no pide tarjeta ni ningún compromiso de pago.',
  ADD COLUMN IF NOT EXISTS faq_2_pregunta TEXT NOT NULL DEFAULT '¿Puedo cancelar cuando quiera?',
  ADD COLUMN IF NOT EXISTS faq_2_respuesta TEXT NOT NULL DEFAULT 'Sí, puedes volver al plan Gratis cuando quieras desde tu propia cuenta.',
  ADD COLUMN IF NOT EXISTS faq_3_pregunta TEXT NOT NULL DEFAULT '¿Sirve para un asesor independiente o solo para inmobiliarias?',
  ADD COLUMN IF NOT EXISTS faq_3_respuesta TEXT NOT NULL DEFAULT 'Para ambos: hay un plan pensado específicamente para cada caso.',
  ADD COLUMN IF NOT EXISTS faq_4_pregunta TEXT NOT NULL DEFAULT '¿Mis datos están seguros y aislados de otras cuentas?',
  ADD COLUMN IF NOT EXISTS faq_4_respuesta TEXT NOT NULL DEFAULT 'Sí. Cada cuenta tiene sus datos completamente separados y protegidos.',
  ADD COLUMN IF NOT EXISTS faq_5_pregunta TEXT NOT NULL DEFAULT '¿Qué pasa si supero el límite del plan Gratis?',
  ADD COLUMN IF NOT EXISTS faq_5_respuesta TEXT NOT NULL DEFAULT 'Te lo indicamos claramente, y puedes pasar a PRO cuando quieras: sin límite de propietarios, inmuebles ni compradores.';
