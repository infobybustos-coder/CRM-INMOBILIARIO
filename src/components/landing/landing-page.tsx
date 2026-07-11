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
const ICONOS_MODULOS = [UserRound, Home, UserSearch, CalendarCheck, UsersRound, BarChart3];

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

  const problemas = [config.problema1, config.problema2, config.problema3, config.problema4];

  const modulos = [
    { titulo: config.modulo1Titulo, descripcion: config.modulo1Descripcion },
    { titulo: config.modulo2Titulo, descripcion: config.modulo2Descripcion },
    { titulo: config.modulo3Titulo, descripcion: config.modulo3Descripcion },
    { titulo: config.modulo4Titulo, descripcion: config.modulo4Descripcion },
    { titulo: config.modulo5Titulo, descripcion: config.modulo5Descripcion },
    { titulo: config.modulo6Titulo, descripcion: config.modulo6Descripcion },
  ];

  const pasos = [
    { numero: "1", titulo: config.paso1Titulo, descripcion: config.paso1Descripcion },
    { numero: "2", titulo: config.paso2Titulo, descripcion: config.paso2Descripcion },
    { numero: "3", titulo: config.paso3Titulo, descripcion: config.paso3Descripcion },
  ];

  const preguntas = [
    { pregunta: config.faq1Pregunta, respuesta: config.faq1Respuesta },
    { pregunta: config.faq2Pregunta, respuesta: config.faq2Respuesta },
    { pregunta: config.faq3Pregunta, respuesta: config.faq3Respuesta },
    { pregunta: config.faq4Pregunta, respuesta: config.faq4Respuesta },
    { pregunta: config.faq5Pregunta, respuesta: config.faq5Respuesta },
  ];

  return (
    <div className="tema-landing min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="font-serif text-xl font-semibold tracking-tight">CRM Inmobiliario</span>
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

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-primary/10 blur-3xl"
        />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" /> {config.badgeTexto}
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-6xl">
            {config.heroTitulo}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{config.heroSubtitulo}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex items-center gap-1.5 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              {config.heroCtaPrincipal} <ArrowRight className="size-4" />
            </Link>
            <Link href="#planes" className="rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent">
              {config.heroCtaSecundario}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" /> {config.trust1}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" /> {config.trust2}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" /> {config.trust3}
            </span>
          </div>
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
              <p className="font-semibold">{config.quickAsesorTitulo}</p>
              <p className="text-sm text-muted-foreground">{config.quickAsesorDescripcion}</p>
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
              <p className="font-semibold">{config.quickInmobiliariaTitulo}</p>
              <p className="text-sm text-muted-foreground">{config.quickInmobiliariaDescripcion}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section className="border-t py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-serif text-2xl font-semibold sm:text-3xl">{config.problemaTitulo}</h2>
          <div className="mt-8 space-y-3 text-left">
            {problemas.map((p) => (
              <div key={p} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3.5 text-sm">
                <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                {p}
              </div>
            ))}
          </div>
          <p className="mt-6 text-base font-medium">{config.transicionTexto}</p>
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
          <h2 className="font-serif text-2xl font-semibold sm:text-3xl">{config.moduloTitulo}</h2>
          <p className="mt-2 text-muted-foreground">{config.moduloSubtitulo}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modulos.map((m, i) => {
              const Icono = ICONOS_MODULOS[i];
              return (
                <div key={m.titulo} className="flex items-start gap-3 rounded-xl border p-4 text-left">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icono className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{m.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{m.descripcion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-2xl font-semibold sm:text-3xl">{config.pasosTitulo}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {pasos.map((p) => (
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
        <h2 className="font-serif text-2xl font-semibold sm:text-3xl">{config.planesTitulo}</h2>
        <p className="mt-2 text-muted-foreground">{config.planesSubtitulo}</p>
        <div className="mt-8">
          <PlanesLanding config={planes} moneda={moneda} />
        </div>
      </section>

      <section className="border-t py-16">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center font-serif text-2xl font-semibold sm:text-3xl">{config.faqTitulo}</h2>
          <div className="mt-8 divide-y rounded-xl border">
            {preguntas.map((p) => (
              <div key={p.pregunta} className="p-4">
                <p className="font-medium">{p.pregunta}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.respuesta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/40 py-16 text-center">
        <h2 className="font-serif text-2xl font-semibold sm:text-3xl">{config.ctaFinalTitulo}</h2>
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
