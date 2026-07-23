"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/inmobiliaria/empresa", label: "Empresa" },
  { href: "/inmobiliaria/usuarios", label: "Usuarios" },
  { href: "/inmobiliaria/roles", label: "Roles" },
  { href: "/inmobiliaria/suscripcion", label: "Suscripción" },
  { href: "/inmobiliaria/preferencias", label: "Preferencias" },
];

export function ConfiguracionTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => {
        const activo = pathname?.startsWith(tab.href) ?? false;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activo
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
