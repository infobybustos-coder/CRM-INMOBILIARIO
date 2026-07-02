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
  HandshakeIcon,
  TrendingUp,
  FileText,
  ListTodo,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Enlace = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Grupo = {
  titulo?: string;
  enlaces: Enlace[];
  soloGestor?: boolean;
};

const GRUPOS: Grupo[] = [
  {
    enlaces: [
      { href: "/inmobiliaria", label: "Centro de Control", icon: LayoutDashboard },
    ],
  },
  {
    titulo: "Gestión",
    enlaces: [
      { href: "/inmobiliaria/propietarios", label: "Captaciones", icon: Users },
      { href: "/inmobiliaria/inmuebles", label: "Inmuebles", icon: Home },
      { href: "/inmobiliaria/compradores", label: "Compradores", icon: UserSearch },
    ],
  },
  {
    titulo: "Operaciones",
    enlaces: [
      { href: "/inmobiliaria/visitas", label: "Visitas", icon: CalendarDays },
      { href: "/inmobiliaria/ofertas", label: "Ofertas", icon: HandshakeIcon },
      { href: "/inmobiliaria/ventas", label: "Ventas", icon: TrendingUp },
    ],
  },
  {
    titulo: "Herramientas",
    enlaces: [
      { href: "/inmobiliaria/agenda", label: "Agenda", icon: ListTodo },
      { href: "/inmobiliaria/documentos", label: "Documentos", icon: FileText },
      { href: "/inmobiliaria/mensajes", label: "Mensajes", icon: MessageSquare },
    ],
  },
  {
    titulo: "Admin",
    soloGestor: true,
    enlaces: [
      { href: "/inmobiliaria/agentes", label: "Agentes", icon: UserCog },
      { href: "/inmobiliaria/equipo", label: "Equipo", icon: UsersRound },
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

  // Mobile: flatten all visible links (max 5 most important)
  const todosEnlaces = GRUPOS.flatMap((g) =>
    g.soloGestor && !esGestor ? [] : g.enlaces
  );

  const enlacesMobile = [
    todosEnlaces.find((e) => e.href === "/inmobiliaria")!,
    todosEnlaces.find((e) => e.href === "/inmobiliaria/visitas")!,
    todosEnlaces.find((e) => e.href === "/inmobiliaria/ofertas")!,
    todosEnlaces.find((e) => e.href === "/inmobiliaria/ventas")!,
    todosEnlaces.find((e) => e.href === "/inmobiliaria/agenda")!,
  ].filter(Boolean);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-card/95 backdrop-blur-sm md:flex",
          colapsado ? "w-16" : "w-56"
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
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {GRUPOS.map((grupo, gi) => {
            if (grupo.soloGestor && !esGestor) return null;
            return (
              <div key={gi}>
                {grupo.titulo && !colapsado && (
                  <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 first:mt-1">
                    {grupo.titulo}
                  </p>
                )}
                {grupo.titulo && colapsado && gi > 0 && (
                  <div className="my-2 border-t" />
                )}
                {grupo.enlaces.map(({ href, label, icon: Icon }) => {
                  const activo =
                    href === "/inmobiliaria"
                      ? pathname === "/inmobiliaria"
                      : pathname.startsWith(href);
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
        {enlacesMobile.map(({ href, label, icon: Icon }) => {
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
