"use client";

import { useState, useTransition } from "react";
import { Eye } from "lucide-react";
import { entrarComoVista, type TipoVista } from "@/app/superadmin/clientes/impersonar-actions";

const OPCIONES: { tipo: TipoVista; etiqueta: string }[] = [
  { tipo: "asesor", etiqueta: "Asesor independiente" },
  { tipo: "inmobiliaria_admin", etiqueta: "Administrador de Inmobiliaria" },
  { tipo: "inmobiliaria_empleado", etiqueta: "Empleado de Inmobiliaria" },
];

export function VistaPreviaBotones() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function entrar(tipo: TipoVista) {
    setError(null);
    startTransition(async () => {
      const resultado = await entrarComoVista(tipo);
      if (resultado && "error" in resultado) setError(resultado.error);
    });
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {OPCIONES.map((o) => (
          <button
            key={o.tipo}
            type="button"
            disabled={pending}
            onClick={() => entrar(o.tipo)}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Eye className="size-3.5" />
            {o.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
