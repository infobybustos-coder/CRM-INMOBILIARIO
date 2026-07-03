"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ENLACE_DASHBOARD = { href: "/inmobiliaria", label: "Vista General", icon: LayoutDashboard };
const ENLACE_ADMIN = { href: "/inmobiliaria/admin", label: "Centro de Control", icon: ShieldCheck };

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

export function InmobiliariaNav({ esAdmin }: { esAdmin: boolean }) {
  const pathname = usePathname();
  const [colapsado, setColapsado] = useState(colapsadoInicial);
  const enlaces = esAdmin ? [ENLACE_DASHBOARD, ENLACE_ADMIN] : [ENLACE_DASHBOARD];

  function alternar() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    localStorage.setItem("nav-colapsado-inmobiliaria", String(nuevo));
    aplicarColapso(nuevo);
  }

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
          href === "/inmobiliaria" ? pathname === "/inmobiliaria" : pathname.startsWith(href);

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
            <Icon className="size-5 md:size-5" />
            <span className={cn(colapsado && "md:hidden")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
