"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Users,
  CreditCard,
  Headset,
  Globe,
  Mail,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ENLACES = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/finanzas", label: "Finanzas", icon: TrendingUp },
  { href: "/superadmin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/superadmin/clientes", label: "Clientes", icon: Users },
  { href: "/superadmin/suscripciones", label: "Suscripciones", icon: CreditCard },
  { href: "/superadmin/landing", label: "Landing", icon: Globe },
  { href: "/superadmin/soporte", label: "Soporte", icon: Headset },
  { href: "/superadmin/correos", label: "Correos", icon: Mail },
  { href: "/superadmin/configuracion", label: "Configuración", icon: Settings },
];

function EnlaceItem({
  href,
  label,
  Icon,
  activo,
  aviso,
  onClick,
}: {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  activo: boolean;
  aviso?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        activo
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <span className="relative shrink-0">
        <Icon className="size-4" />
        {aviso && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-red-500" />}
      </span>
      {label}
    </Link>
  );
}

export function SuperadminNav({ avisos = {} }: { avisos?: Record<string, boolean> }) {
  const pathname = usePathname();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const esActivo = (href: string) =>
    href === "/superadmin" ? pathname === "/superadmin" : (pathname?.startsWith(href) ?? false);

  return (
    <>
      {/* Barra fija móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center border-t bg-card/95 px-4 py-2 backdrop-blur-sm md:hidden">
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(true)}
          className="flex items-center gap-2 px-3 py-1 text-sm text-muted-foreground"
        >
          <Menu className="size-5" /> Menú
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
            <div className="flex flex-col gap-1">
              {ENLACES.map((enlace) => (
                <EnlaceItem
                  key={enlace.href}
                  href={enlace.href}
                  label={enlace.label}
                  Icon={enlace.icon}
                  activo={esActivo(enlace.href)}
                  aviso={avisos[enlace.href]}
                  onClick={() => setMenuMovilAbierto(false)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar fijo desktop */}
      <nav className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col gap-1 overflow-y-auto border-r bg-card/95 p-2 backdrop-blur-sm md:flex">
        {ENLACES.map((enlace) => (
          <EnlaceItem
            key={enlace.href}
            href={enlace.href}
            label={enlace.label}
            Icon={enlace.icon}
            activo={esActivo(enlace.href)}
            aviso={avisos[enlace.href]}
          />
        ))}
      </nav>
    </>
  );
}
