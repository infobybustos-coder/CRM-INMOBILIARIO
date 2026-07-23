"use client";

import { useState, useTransition } from "react";
import { Eye } from "lucide-react";
import { entrarComoVista, type TipoVista } from "@/app/superadmin/clientes/impersonar-actions";

const GRUPOS: {
  titulo: string;
  gratis: TipoVista;
  pro: TipoVista;
}[] = [
  { titulo: "Asesor independiente", gratis: "asesor_gratis", pro: "asesor_pro" },
  {
    titulo: "Administrador de Inmobiliaria",
    gratis: "inmobiliaria_admin_gratis",
    pro: "inmobiliaria_admin_pro",
  },
  {
    titulo: "Empleado de Inmobiliaria",
    gratis: "inmobiliaria_empleado_gratis",
    pro: "inmobiliaria_empleado_pro",
  },
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
      <div className="space-y-1.5">
        {GRUPOS.map((g) => (
          <div key={g.titulo} className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm">
              <Eye className="size-3.5 text-muted-foreground" />
              {g.titulo}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() => entrar(g.gratis)}
              className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              Gratis
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => entrar(g.pro)}
              className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              PRO
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
