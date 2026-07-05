"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

export function LimitePlanAviso({ mensaje }: { mensaje: string }) {
  const pathname = usePathname();
  const href = pathname?.startsWith("/inmobiliaria") ? "/inmobiliaria/suscripcion" : "/asesor/suscripcion/pago";

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <p className="flex items-start gap-2">
        <Lock className="mt-0.5 size-4 shrink-0 text-amber-600" />
        {mensaje}
      </p>
      <Link
        href={href}
        className="block rounded-md bg-primary px-3 py-1.5 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Ver plan PRO
      </Link>
    </div>
  );
}
