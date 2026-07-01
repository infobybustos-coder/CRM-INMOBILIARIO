"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserSearch,
  Home,
  UsersRound,
  UserCog,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Enlace = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ENLACES_BASE: Enlace[] = [
  { href: "/inmobiliaria", label: "Panel general", icon: LayoutDashboard },
  { href: "/inmobiliaria/propietarios", label: "Captaciones", icon: Users },
  { href: "/inmobiliaria/inmuebles", label: "Inmuebles", icon: Home },
  { href: "/inmobiliaria/compradores", label: "Compradores", icon: UserSearch },
];

const ENLACE_AGENTES: Enlace = {
  href: "/inmobiliaria/agentes",
  label: "Agentes",
  icon: UserCog,
};

const ENLACE_EQUIPO: Enlace = {
  href: "/inmobiliaria/equipo",
  label: "Equipo",
  icon: UsersRound,
};

function aplicarColapso(colapsado: boolean) {
  document.documentElement
    .querySelector(".layout-inmobiliaria")
    ?.setAttribute("data-nav-colapsado", String(colapsado));
}

function colapsadoInicial() {
  if (typeof window === "undefined") return false;
  const guardado = localStorage.getItem("nav-inmobiliaria-colapsado") === "true";
  aplicarColapso(guardado);
  return guardado;
}

export function InmobiliariaNav({
  esGestor,
  esCaptador,
}: {
  esGestor: boolean;
  esCaptador: boolean;
}) {
  const pathname = usePathname();
  const [colapsado, setColapsado] = useState(colapsadoInicial);

  function alternar() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    localStorage.setItem("nav-inmobiliaria-colapsado", String(nuevo));
    aplicarColapso(nuevo);
  }

  const enlaces = [
    ...ENLACES_BASE.filter((e) => {
      if (esCaptador && e.href === "/inmobiliaria/compradores") return false;
      if (esCaptador && e.href === "/inmobiliaria/inmuebles") return false;
      return true;
    }),
    ...(esGestor ? [ENLACE_AGENTES, ENLACE_EQUIPO] : []),
  ];

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 backdrop-blur-sm",
        "md:inset-y-0 md:right-auto md:bottom-0 md:flex-col md:gap-1 md:border-t-0 md:border-r md:p-2",
        colapsado ? "md:w-16" : "md:w-56"
      )}
    >
      <button
        type="button"
        onClick={alternar}
        aria-label={colapsado ? "Expandir menú" : "Contraer menú"}
        className="hidden items-center justify-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground md:flex"
      >
        {colapsado ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
      </button>

      {enlaces.map(({ href, label, icon: Icon }) => {
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
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground transition-colors",
              "md:flex-row md:flex-none md:gap-3 md:rounded-md md:px-3 md:py-2 md:text-sm",
              colapsado && "md:justify-center",
              activo
                ? "text-primary md:bg-primary/10 md:text-primary"
                : "hover:text-foreground"
            )}
          >
            <Icon className="size-5" />
            <span className={cn(colapsado && "md:hidden")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
