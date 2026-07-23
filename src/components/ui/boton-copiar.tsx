"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Botón de copiar compacto (solo icono + etiqueta corta), para celdas de
// tabla donde el input+botón de CopiarEnlace ocupa demasiado sitio.
export function BotonCopiar({ valor, etiqueta = "Copiar" }: { valor: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(valor);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
      className={cn(
        "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium hover:bg-accent",
        copiado ? "text-emerald-600" : "text-muted-foreground"
      )}
    >
      {copiado ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copiado ? "Copiado" : etiqueta}
    </button>
  );
}
