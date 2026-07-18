"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Home,
  UserSearch,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  UserCog,
  ShieldCheck,
  MessageSquare,
  SlidersHorizontal,
  User,
  Lock,
  Headset,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Enlace = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  bloqueado?: boolean;
  activoTambien?: string[];
};

type Grupo = { titulo?: string; enlaces: Enlace[] };

const GRUPOS_ADMIN: Grupo[] = [
  { enlaces: [{ href: "/inmobiliaria", label: "Centro de Control", icon: LayoutDashboard }] },
  {
    titulo: "Captación",
    enlaces: [
      { href: "/inmobiliaria/propietarios", label: "Propietarios", icon: Users },
      { href: "/inmobiliaria/inmuebles", label: "Inmuebles", icon: Home },
      { href: "/inmobiliaria/compradores", label: "Compradores", icon: UserSearch },
      { href: "/inmobiliaria/visitas", label: "Visitas", icon: CalendarClock },
    ],
  },
  {
    titulo: "Seguimiento",
    enlaces: [
      {
        href: "/inmobiliaria/seguimiento",
        label: "Agenda y Tareas",
        icon: CalendarDays,
        activoTambien: ["/inmobiliaria/agenda", "/inmobiliaria/tareas"],
      },
    ],
  },
  {
    titulo: "Equipo",
    enlaces: [
      { href: "/inmobiliaria/agentes", label: "Agentes", icon: UserCog },
      { href: "/inmobiliaria/administradores", label: "Administradores", icon: ShieldCheck },
      { href: "/inmobiliaria/mensajes", label: "Mensajes", icon: MessageSquare, bloqueado: true },
    ],
  },
  {
    titulo: "Centro de ayuda",
    enlaces: [{ href: "/inmobiliaria/soporte", label: "Soporte", icon: Headset }],
  },
  {
    enlaces: [
      {
        href: "/inmobiliaria/empresa",
        label: "Configuración",
        icon: SlidersHorizontal,
        activoTambien: [
          "/inmobiliaria/usuarios",
          "/inmobiliaria/roles",
          "/inmobiliaria/suscripcion",
          "/inmobiliaria/preferencias",
        ],
      },
    ],
  },
];

const GRUPOS_EMPLEADO: Grupo[] = [
  { enlaces: [{ href: "/inmobiliaria", label: "Inicio", icon: LayoutDashboard }] },
  {
    titulo: "Mi Captación",
    enlaces: [
      { href: "/inmobiliaria/mis-propietarios", label: "Mis propietarios", icon: Users },
      { href: "/inmobiliaria/inmuebles", label: "Inmuebles", icon: Home },
      { href: "/inmobiliaria/mis-compradores", label: "Mis compradores", icon: UserSearch },
      { href: "/inmobiliaria/mis-visitas", label: "Mis visitas", icon: CalendarClock },
    ],
  },
  {
    titulo: "Mi Trabajo",
    enlaces: [
      { href: "/inmobiliaria/mi-agenda", label: "Agenda", icon: CalendarDays },
      { href: "/inmobiliaria/mis-tareas", label: "Tareas", icon: CheckSquare },
    ],
  },
  {
    titulo: "Mi Perfil",
    enlaces: [{ href: "/inmobiliaria/perfil", label: "Mi perfil", icon: User }],
  },
  {
    titulo: "Centro de ayuda",
    enlaces: [{ href: "/inmobiliaria/soporte", label: "Soporte", icon: Headset }],
  },
];

function aplicarColapso(colapsado: boolean) {
  document.documentElement
    .querySelector(".tema-inmobiliaria")
    ?.setAttribute("data-nav-colapsado", String(colapsado));
}

function colapsadoInicial() {
  if (typeof window === "undefined") return false;
  const guardado = localStorage.getItem("nav-colapsado-inmobiliaria") === "true";
  aplicarColapso(guardado);
  return guardado;
}

function EnlaceItem({
  enlace,
  activo,
  colapsado,
  aviso,
  onClick,
}: {
  enlace: Enlace;
  activo: boolean;
  colapsado: boolean;
  aviso?: boolean;
  onClick?: () => void;
}) {
  const Icon = enlace.icon;
  return (
    <Link
      href={enlace.href}
      onClick={onClick}
      title={colapsado ? enlace.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        colapsado && "md:justify-center",
        activo
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <span className="relative shrink-0">
        <Icon className="size-4" />
        {aviso && (
          <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-red-500" />
        )}
      </span>
      <span className={cn("flex-1", colapsado && "md:hidden")}>{enlace.label}</span>
      {enlace.bloqueado && (
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground",
            colapsado && "md:hidden"
          )}
        >
          <Lock className="size-2.5" /> Próximamente
        </span>
      )}
    </Link>
  );
}

function ListaGrupos({
  grupos,
  pathname,
  colapsado,
  avisos,
  onNavegar,
}: {
  grupos: Grupo[];
  pathname: string | null;
  colapsado: boolean;
  avisos?: Record<string, boolean>;
  onNavegar?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {grupos.map((grupo, i) => (
        <div key={grupo.titulo ?? i} className="flex flex-col gap-1">
          {grupo.titulo && (
            <span
              className={cn(
                "px-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
                colapsado && "md:hidden"
              )}
            >
              {grupo.titulo}
            </span>
          )}
          {grupo.enlaces.map((enlace) => {
            const activo =
              enlace.href === "/inmobiliaria"
                ? pathname === "/inmobiliaria"
                : (pathname?.startsWith(enlace.href) ?? false) ||
                  (enlace.activoTambien?.some((p) => pathname?.startsWith(p)) ?? false);
            return (
              <EnlaceItem
                key={enlace.href}
                enlace={enlace}
                activo={activo}
                colapsado={colapsado}
                aviso={avisos?.[enlace.href]}
                onClick={onNavegar}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function InmobiliariaNav({
  esAdmin,
  avisos = {},
}: {
  esAdmin: boolean;
  avisos?: Record<string, boolean>;
}) {
  const pathname = usePathname();
  const [colapsado, setColapsado] = useState(colapsadoInicial);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const grupos = esAdmin ? GRUPOS_ADMIN : GRUPOS_EMPLEADO;
  const hayAvisos = Object.values(avisos).some(Boolean);

  function alternar() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    localStorage.setItem("nav-colapsado-inmobiliaria", String(nuevo));
    aplicarColapso(nuevo);
  }

  return (
    <>
      {/* Barra fija móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t bg-card/95 px-4 py-2 backdrop-blur-sm md:hidden">
        <Link
          href="/inmobiliaria"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 text-xs",
            pathname === "/inmobiliaria" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="size-5" />
          {esAdmin ? "Control" : "Inicio"}
        </Link>
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(true)}
          className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground"
        >
          <span className="relative">
            <Menu className="size-5" />
            {hayAvisos && (
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-red-500" />
            )}
          </span>
          Menú
        </button>
      </div>

      {menuMovilAbierto && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm md:hidden">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border bg-card p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Menú</span>
              <button
                type="button"
                onClick={() => setMenuMovilAbierto(false)}
                aria-label="Cerrar menú"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <ListaGrupos
              grupos={grupos}
              pathname={pathname}
              colapsado={false}
              avisos={avisos}
              onNavegar={() => setMenuMovilAbierto(false)}
            />
          </div>
        </div>
      )}

      {/* Sidebar fijo desktop */}
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col gap-2 overflow-y-auto border-r bg-card/95 p-2 backdrop-blur-sm md:flex",
          colapsado ? "md:w-16" : "md:w-56"
        )}
      >
        <button
          type="button"
          onClick={alternar}
          aria-label={colapsado ? "Expandir menú" : "Contraer menú"}
          className="flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {colapsado ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
        </button>
        <ListaGrupos grupos={grupos} pathname={pathname} colapsado={colapsado} avisos={avisos} />
      </nav>
    </>
  );
}
