"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserSearch, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const ENLACES = [
  { href: "/asesor", label: "Inicio", icon: LayoutDashboard },
  { href: "/asesor/propietarios", label: "Propietarios", icon: Users },
  { href: "/asesor/compradores", label: "Compradores", icon: UserSearch },
  { href: "/asesor/inmuebles", label: "Inmuebles", icon: Home },
];

export function AsesorNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 backdrop-blur-sm",
        "md:inset-y-0 md:right-auto md:bottom-0 md:w-56 md:flex-col md:gap-1 md:border-t-0 md:border-r md:p-2"
      )}
    >
      {ENLACES.map(({ href, label, icon: Icon }) => {
        const activo =
          href === "/asesor" ? pathname === "/asesor" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground transition-colors",
              "md:flex-row md:flex-none md:gap-3 md:rounded-md md:px-3 md:py-2 md:text-sm",
              activo
                ? "text-primary md:bg-primary/10 md:text-primary"
                : "hover:text-foreground"
            )}
          >
            <Icon className="size-5 md:size-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
