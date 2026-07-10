import Link from "next/link";
import {
  LayoutGrid,
  Users,
  Rocket,
  UserRound,
  Building2,
  ArrowRight,
  Check,
  X,
  Home,
  UserSearch,
  CalendarCheck,
  UsersRound,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { type LandingConfig } from "@/lib/landing-config";
import { type ConfigPlanes } from "@/lib/planes";
import { PlanesLanding } from "./planes-landing";

const ICONOS_CARACTERISTICAS = [LayoutGrid, Users, Rocket];

const PROBLEMAS = [
  "Los datos de tus propietarios están repartidos entre WhatsApp, notas y hojas de cálculo.",
  "No sabes qué inmuebles siguen disponibles sin llamar a alguien de tu equipo.",
  "Se te escapan compradores porque nadie hizo seguimiento a tiempo.",
  "No tienes ni idea de cuánto está vendiendo cada asesor.",
];

const MODULOS = [
  { icon: UserRound, titulo: "Propietarios", descripcion: "Capta y organiza a tus propietarios sin perder ni un contacto." },
  { icon: Home, titulo: "Inmuebles", descripcion: "Toda tu cartera en un mismo sitio, con el estado siempre al día." },
  { icon: UserSearch, titulo: "Compradores", descripcion: "Haz seguimiento y no dejes escapar ninguna oportunidad." },
  { icon: CalendarCheck, titulo: "Visitas y agenda", descripcion: "Planifica visitas y tareas sin depender de la memoria." },
  { icon: UsersRound, titulo: "Equipo", descripcion: "Reparte el trabajo entre tus asesores y ve quién rinde más." },
  { icon: BarChart3, titulo: "Rendimiento", descripcion: "Métricas claras de tu negocio, sin montar una hoja de cálculo." },
];

const PASOS = [
  { numero: "1", titulo: "Crea tu cuenta gratis", descripcion: "Sin tarjeta de crédito, en menos de un minuto." },
  { numero: "2", titulo: "Añade tu cartera", descripcion: "Propietarios, inmuebles y compradores, todo en su sitio." },
  { numero: "3", titulo: "Vende con orden", descripcion: "Haz seguimiento, reparte tareas y cierra más operaciones." },
];

const PREGUNTAS = [
  {
    pregunta: "¿Necesito tarjeta de crédito para empezar?",
    respuesta: "No. El plan Gratis no pide tarjeta ni ningún compromiso de pago.",
  },
  {
    pregunta: "¿Puedo cancelar cuando quiera?",
    respuesta: "Sí, puedes volver al plan Gratis cuando quieras desde tu propia cuenta.",
  },
  {
    pregunta: "¿Sirve para un asesor independiente o solo para inmobiliarias?",
    respuesta: "Para ambos: hay un plan pensado específicamente para cada caso.",
  },
  {
    pregunta: "¿Mis datos están seguros y aislados de otras cuentas?",
    respuesta: "Sí. Cada cuenta tiene sus datos completamente separados y protegidos.",
  },
  {
    pregunta: "¿Qué pasa si supero el límite del plan Gratis?",
    respuesta: "Te lo indicamos claramente, y puedes pasar a PRO cuando quieras: sin límite de propietarios, inmuebles ni compradores.",
  },
];

export function LandingPage({
  config,
  planes,
  moneda,
}: {
  config: LandingConfig;
  planes: ConfigPlanes;
  moneda: "EUR" | "USD";
}) {
  const caracteristicas = [
    { titulo: config.caracteristica1Titulo, descripcion: config.caracteristica1Descripcion },
    { titulo: config.caracteristica2Titulo, descripcion: config.caracteristica2Descripcion },
    { titulo: config.caracteristica3Titulo, descripcion: config.caracteristica3Descripcion },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-lg font-semibold">CRM Inmobiliario</span>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5" /> Software de gestión inmobiliaria
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{config.heroTitulo}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{config.heroSubtitulo}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {config.heroCtaPrincipal} <ArrowRight className="size-4" />
          </Link>
          <Link href="#planes" className="rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent">
            {config.heroCtaSecundario}
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-600" /> Gratis para siempre en el plan básico
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-600" /> Sin tarjeta de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-600" /> Cancela cuando quieras
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/signup?tipo=asesor"
            className="group flex items-center gap-4 rounded-xl border p-5 transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Soy asesor independiente</p>
              <p className="text-sm text-muted-foreground">Trabajo por mi cuenta y gestiono mi propio negocio.</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/signup?tipo=inmobiliaria"
            className="group flex items-center gap-4 rounded-xl border p-5 transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Tengo una inmobiliaria</p>
              <p className="text-sm text-muted-foreground">Tengo un equipo de asesores que coordinar.</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section className="border-t py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">¿Te suena esto?</h2>
          <div className="mt-8 space-y-3 text-left">
            {PROBLEMAS.map((p) => (
              <div key={p} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3.5 text-sm">
                <X className="mt-0.5 size-4 shrink-0 text-rose-500" />
                {p}
              </div>
            ))}
          </div>
          <p className="mt-6 text-base font-medium">Con CRM Inmobiliario, todo eso desaparece.</p>
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 px-4 sm:grid-cols-3">
          {caracteristicas.map((c, i) => {
            const Icono = ICONOS_CARACTERISTICAS[i];
            return (
              <div key={c.titulo} className="space-y-2 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icono className="size-5" />
                </div>
                <h3 className="font-semibold">{c.titulo}</h3>
                <p className="text-sm text-muted-foreground">{c.descripcion}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Todo lo que necesitas, en un solo sitio</h2>
          <p className="mt-2 text-muted-foreground">Nada de herramientas sueltas ni suscripciones cruzadas.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULOS.map((m) => (
              <div key={m.titulo} className="flex items-start gap-3 rounded-xl border p-4 text-left">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <m.icon className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold">{m.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{m.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Empieza en tres pasos</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {PASOS.map((p) => (
              <div key={p.numero} className="space-y-2">
                <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {p.numero}
                </div>
                <h3 className="font-semibold">{p.titulo}</h3>
                <p className="text-sm text-muted-foreground">{p.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Planes claros, sin sorpresas</h2>
        <p className="mt-2 text-muted-foreground">
          Empieza gratis. Sin permanencia — cambia o cancela cuando quieras.
        </p>
        <div className="mt-8">
          <PlanesLanding config={planes} moneda={moneda} />
        </div>
      </section>

      <section className="border-t py-16">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">Preguntas frecuentes</h2>
          <div className="mt-8 divide-y rounded-xl border">
            {PREGUNTAS.map((p) => (
              <div key={p.pregunta} className="p-4">
                <p className="font-medium">{p.pregunta}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.respuesta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40 py-16 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">{config.ctaFinalTitulo}</h2>
        <p className="mt-2 text-muted-foreground">{config.ctaFinalSubtitulo}</p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Crear cuenta gratis <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} CRM Inmobiliario</span>
        <div className="flex gap-4">
          <Link href="/terminos" className="hover:text-foreground">
            Términos y Condiciones
          </Link>
          <Link href="/privacidad" className="hover:text-foreground">
            Política de Privacidad
          </Link>
        </div>
      </footer>
    </div>
  );
}
