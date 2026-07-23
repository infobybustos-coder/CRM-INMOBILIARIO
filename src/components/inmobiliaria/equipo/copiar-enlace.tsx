"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopiarEnlace({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={link}
        className="w-full min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-xs text-foreground"
      />
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(link);
          setCopiado(true);
        }}
        className="flex size-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
        aria-label="Copiar enlace"
      >
        {copiado ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
