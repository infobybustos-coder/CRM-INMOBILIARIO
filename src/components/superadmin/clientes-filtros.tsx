"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { banderaPais, nombrePais } from "@/lib/paises";

function Toggle({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        activo ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}

export function ClientesFiltros({ paisesDisponibles }: { paisesDisponibles: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function actualizar(clave: string, valor: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) params.set(clave, valor);
    else params.delete(clave);
    router.push(`${pathname}?${params.toString()}`);
  }

  const plan = searchParams.get("plan");
  const tipo = searchParams.get("tipo");
  const pais = searchParams.get("pais") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle activo={plan === "gratis"} onClick={() => actualizar("plan", plan === "gratis" ? null : "gratis")}>
        Free
      </Toggle>
      <Toggle activo={plan === "pago"} onClick={() => actualizar("plan", plan === "pago" ? null : "pago")}>
        Pro
      </Toggle>
      <span className="mx-1 h-4 w-px bg-border" />
      <Toggle activo={tipo === "asesor"} onClick={() => actualizar("tipo", tipo === "asesor" ? null : "asesor")}>
        Asesor
      </Toggle>
      <Toggle
        activo={tipo === "inmobiliaria"}
        onClick={() => actualizar("tipo", tipo === "inmobiliaria" ? null : "inmobiliaria")}
      >
        Inmobiliaria
      </Toggle>
      <span className="mx-1 h-4 w-px bg-border" />
      <select
        value={pais}
        onChange={(e) => actualizar("pais", e.target.value || null)}
        className="rounded-md border bg-background px-2 py-1 text-xs"
      >
        <option value="">Todos los países</option>
        {paisesDisponibles.map((codigo) => (
          <option key={codigo} value={codigo}>
            {banderaPais(codigo)} {nombrePais(codigo)}
          </option>
        ))}
      </select>
    </div>
  );
}
