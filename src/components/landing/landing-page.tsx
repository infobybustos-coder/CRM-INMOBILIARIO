import Link from "next/link";
import { LayoutGrid, Users, Rocket, UserRound, Building2, ArrowRight } from "lucide-react";
import { type LandingConfig } from "@/lib/landing-config";
import { type ConfigPlanes } from "@/lib/planes";
import { PlanesLanding } from "./planes-landing";

const ICONOS_CARACTERISTICAS = [LayoutGrid, Users, Rocket];

export function LandingPage({ config, planes }: { config: LandingConfig; planes: ConfigPlanes }) {
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
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{config.heroTitulo}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{config.heroSubtitulo}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {config.heroCtaPrincipal} <ArrowRight className="size-4" />
          </Link>
          <Link
            href="#planes"
            className="rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            {config.heroCtaSecundario}
          </Link>
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

      <section id="planes" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Planes claros, sin sorpresas</h2>
        <p className="mt-2 text-muted-foreground">Empieza gratis. Cambia de plan cuando quieras.</p>
        <div className="mt-8">
          <PlanesLanding config={planes} />
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
