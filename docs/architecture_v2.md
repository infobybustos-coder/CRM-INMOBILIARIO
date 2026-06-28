# Arquitectura — CRM Inmobiliario (MVP) · Modo Asesor / Modo Inmobiliaria

## 1. Qué cambia respecto a la versión anterior

- **Sin módulos de IA por ahora** (Radar de Captación, Centro de Oportunidades, Scoring, Automatizaciones, Mercado). Quedan diseñados para una fase 2, pero no se construyen en el MVP.
- **Dos experiencias genuinamente distintas**, no un solo CRM con funciones ocultas según el plan:
  - **Modo Asesor**: una sola persona, captura ultrarrápida desde el móvil, sin nada que no use.
  - **Modo Inmobiliaria**: equipo, roles, coordinación, reparto de leads.
- **Pensado desde el origen para España y Latinoamérica** (moneda, formato de teléfono, país), no adaptado después.

## 2. Una base de datos, dos experiencias — cómo se hace sin duplicar el producto

La tabla `tenants` tiene una columna `tipo_plan` (`asesor` | `inmobiliaria`). Esa columna decide qué interfaz carga la persona al entrar, usando **rutas separadas en Next.js**:

```
/app
  /(asesor)/...         ← layout y pantallas Modo Asesor
  /(inmobiliaria)/...   ← layout y pantallas Modo Inmobiliaria
  /api/...              ← misma capa de API para ambos
```

Ambas experiencias leen y escriben sobre **las mismas tablas** (`propietarios`, `compradores`, `inmuebles`...). Lo que cambia es:

| | Modo Asesor | Modo Inmobiliaria |
|---|---|---|
| Usuarios por cuenta | 1 | Varios (equipo) |
| Roles | No aplica (es su propia cuenta) | Administrador, Director Comercial, Agente, Captador |
| Pantallas de equipo/reparto de leads | No existen en esta experiencia | Sí |
| Mapa comercial con varios agentes | No (más adelante, fase 2) | Sí (fase 2) |
| Velocidad de captura | Prioridad máxima: registrar un cliente en segundos desde el móvil, idealmente durante o justo después de una visita | Igual de rápida, pero con contexto de a qué agente/equipo pertenece |
| Dashboard | Personal (sus propios números) | Ejecutivo (todo el equipo) |

Esto evita mantener dos bases de código completas: es **un mismo backend y esquema de datos**, con dos conjuntos de pantallas y reglas de permisos distintas activadas según `tipo_plan`.

## 3. Por qué esto es diferente a lo que ya existe en el mercado

Los CRM inmobiliarios establecidos en España (Inmovilla, Mobilia, Witei, idealista Tools) llevan años acumulando funciones — publicación en portales, facturación, firma digital — y esto los hace potentes pero pesados de aprender. Los más nuevos y simples (tipo Fincta) priorizan la velocidad para el agente individual, pero no están pensados para crecer a un equipo con roles. Y casi todos están construidos primero para España o primero para Latinoamérica, no para ambos desde el día uno.

Nuestra apuesta: la **velocidad de captura del agente individual**, sin la carga de los CRM grandes, pero con un **camino de crecimiento real hacia el modo equipo** sin cambiar de herramienta — y compatible con España y Latinoamérica desde el primer despliegue.

## 4. Consideraciones pan-hispanas en el diseño

- `tenants.pais` y `tenants.moneda` — cada cuenta define su país y moneda al darse de alta; los importes (`NUMERIC(14,2)`) tienen suficiente precisión para monedas con cifras más grandes (COP, CLP) sin perder exactitud.
- Los campos de teléfono se guardan como texto libre (no se fuerza un formato fijo de país), y la validación/formato visual se hace en el frontend según `tenants.pais` — así no hay que rehacer la base de datos si se añade un país nuevo.
- `zonas.provincia_estado` usa un nombre neutro porque en España es "provincia" y en la mayoría de países de Latinoamérica es "estado" o "departamento".
- Los textos de la interfaz se preparan desde el inicio con un sistema de internacionalización (i18n) en español neutro, evitando modismos muy locales (ej. "piso" vs "departamento" se resuelve como configuración, no como texto fijo).

## 5. Módulos del MVP (sin IA)

| Módulo | Disponible en |
|---|---|
| Propietarios (pipeline, ficha, documentos, notas, tareas) | Asesor + Inmobiliaria |
| Compradores (pipeline, ficha) | Asesor + Inmobiliaria |
| Inmuebles (ficha, fotos, vínculo con propietario/comprador) | Asesor + Inmobiliaria |
| Vistas Kanban, Tabla, Calendario | Asesor + Inmobiliaria |
| Dashboard personal | Asesor |
| Dashboard ejecutivo + equipos + roles + reparto de leads | Inmobiliaria |
| Suscripción/plan (Stripe) | Ambos (con `limite_usuarios` distinto) |

## 6. Lo que queda preparado para una fase 2 (cuando se decida activar IA)

Ya tienes diseñado, en el `schema.sql` original (versión completa), todo lo necesario para añadir sin rehacer nada de lo anterior:
- Radar de Captación (leads entrantes, integraciones con Meta Ads/Google Ads/CSV)
- Centro de Oportunidades
- Scoring de probabilidad de cierre
- Automatizaciones tipo Zapier
- Mercado con estadísticas agregadas por zona

Cuando llegue el momento, esas tablas se añaden encima del esquema actual sin tocar `propietarios`, `compradores` ni `inmuebles`.

## 7. Stack (sin cambios respecto a la propuesta original)

Next.js + React + TypeScript + Tailwind + shadcn/ui · Supabase (PostgreSQL + Auth + Storage) · Zustand · React Query · Vercel (hosting) · Stripe (suscripciones) · FullCalendar (vistas de calendario).

## 8. Próximos pasos

1. Confirmar el wording exacto que se usará en cada país (ej. "piso"/"departamento"/"casa") para los primeros 2-3 mercados objetivo.
2. Definir qué países concretos se lanzan primero (¿España + México? ¿España + Colombia?) — afecta a qué formatos de moneda/teléfono priorizar en el MVP.
3. Construir con la nueva hoja de ruta (más abajo, en PDF).
