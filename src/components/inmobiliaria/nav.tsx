"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  UserSearch,
  Home,
  UsersRound,
  UserCog,
  CalendarDays,
  MessageSquare,
  ListTodo,
  CheckSquare,
  Activity,
  BarChart2,
  Settings,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Enlace = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  proximamente?: boolean;
  soloGestor?: boolean;
};

type Grupo = {
  titulo: string;
  emoji: string;
  enlaces: Enlace[];
  soloGestor?: boolean;
};

const GRUPOS: Grupo[] = [
  {
    titulo: "Captación",
    emoji: "🎯",
    enlaces: [
      { href: "/inmobiliaria/propietarios", label: "Propietarios", icon: Users },
      { href: "/inmobiliaria/inmuebles", label: "Inmuebles", icon: Home },
      { href: "/inmobiliaria/compradores", label: "Compradores", icon: UserSearch },
      { href: "/inmobiliaria/visitas", label: "Visitas", icon: CalendarDays },
    ],
  },
  {
    titulo: "Seguimiento",
    emoji: "✅",
    enlaces: [
      { href: "/inmobiliaria/agenda", label: "Agenda", icon: CalendarDays },
      { href: "/inmobiliaria/tareas", label: "Tareas", icon: CheckSquare },
    ],
  },
  {
    titulo: "Equipo",
    emoji: "👥",
    soloGestor: true,
    enlaces: [
      { href: "/inmobiliaria/agentes", label: "Agentes", icon: UserCog },
      { href: "/inmobiliaria/rendimiento", label: "Rendimiento", icon: BarChart2 },
      { href: "#", label: "Mensajes", icon: MessageSquare, proximamente: true },
      { href: "/inmobiliaria/actividad", label: "Actividad", icon: Activity },
    ],
  },
  {
    titulo: "Configuración",
    emoji: "⚙️",
    soloGestor: true,
    enlaces: [
      { href: "/inmobiliaria/equipo", label: "Usuarios", icon: UsersRound },
      { href: "/inmobiliaria/empresa", label: "Empresa", icon: Settings },
      { href: "/inmobiliaria/suscripcion", label: "Suscripción", icon: Settings },
    ],
  },
];

function aplicarColapso(colapsado: boolean) {
  document.documentElement
    .querySelector(".layout-inmobiliaria")
    ?.setAttribute("data-nav-colapsado", String(colapsado));
}

export function InmobiliariaNav({ esGestor }: { esGestor: boolean }) {
  const pathname = usePathname();
  const [colapsado, setColapsado] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("nav-inmobiliaria-colapsado") === "true";
    if (guardado) {
      setColapsado(true);
      aplicarColapso(true);
    }
  }, []);

  function alternar() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    localStorage.setItem("nav-inmobiliaria-colapsado", String(nuevo));
    aplicarColapso(nuevo);
  }

  const dashboardActivo = pathname === "/inmobiliaria";

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-card/95 backdrop-blur-sm md:flex",
          colapsado ? "w-16" : "w-60"
        )}
      >
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={alternar}
          aria-label={colapsado ? "Expandir menú" : "Contraer menú"}
          className="flex items-center justify-center gap-2 border-b px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {colapsado ? (
            <ChevronRight className="size-5" />
          ) : (
            <>
              <ChevronLeft className="size-5" />
              <span className="text-xs font-medium">Contraer</span>
            </>
          )}
        </button>

        {/* Scrollable link area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">

          {/* Centro de Control — direct top button */}
          <Link
            href="/inmobiliaria"
            title={colapsado ? "Centro de Control" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              colapsado && "justify-center",
              dashboardActivo
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <LayoutDashboard className="size-4 shrink-0" />
            {!colapsado && <span>Centro de Control</span>}
          </Link>

          {/* Groups */}
          {GRUPOS.map((grupo, gi) => {
            if (grupo.soloGestor && !esGestor) return null;

            const visibleEnlaces = grupo.enlaces.filter(
              (e) => !e.soloGestor || esGestor
            );

            return (
              <div key={gi} className="pt-3">
                {/* Group header */}
                {!colapsado ? (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {grupo.emoji} {grupo.titulo}
                  </p>
                ) : (
                  <div className="my-1.5 border-t" />
                )}

                {/* Links */}
                {visibleEnlaces.map(({ href, label, icon: Icon, proximamente }) => {
                  if (proximamente) {
                    return (
                      <div
                        key={label}
                        title={colapsado ? `${label} (Próximamente)` : undefined}
                        className={cn(
                          "flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm opacity-40",
                          colapsado && "justify-center"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        {!colapsado && (
                          <>
                            <span className="flex-1">{label}</span>
                            <Lock className="size-3 shrink-0" />
                          </>
                        )}
                      </div>
                    );
                  }

                  const activo = pathname.startsWith(href) && href !== "/inmobiliaria";
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={colapsado ? label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        colapsado && "justify-center",
                        activo
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!colapsado && <span>{label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile bottom bar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 backdrop-blur-sm md:hidden">
        {[
          { href: "/inmobiliaria", label: "Dashboard", icon: LayoutDashboard },
          { href: "/inmobiliaria/propietarios", label: "Captación", icon: Users },
          { href: "/inmobiliaria/visitas", label: "Visitas", icon: CalendarDays },
          { href: "/inmobiliaria/agenda", label: "Agenda", icon: ListTodo },
          { href: "/inmobiliaria/agentes", label: "Equipo", icon: UserCog },
        ].map(({ href, label, icon: Icon }) => {
          const activo =
            href === "/inmobiliaria"
              ? pathname === "/inmobiliaria"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                activo ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
