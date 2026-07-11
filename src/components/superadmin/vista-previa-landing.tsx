"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

export function VistaPreviaLanding() {
  const [key, setKey] = useState(0);

  return (
    <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Vista previa en vivo</h2>
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCw className="size-3.5" /> Actualizar
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <iframe key={key} src="/" title="Vista previa de la landing" className="h-[80vh] w-full" />
      </div>
      <p className="text-xs text-muted-foreground">
        Guarda los cambios y pulsa &quot;Actualizar&quot; para verlos aquí.
      </p>
    </div>
  );
}
