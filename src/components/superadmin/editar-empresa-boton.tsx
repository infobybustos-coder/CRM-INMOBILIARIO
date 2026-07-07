"use client";

import { useState, useTransition } from "react";
import { editarEmpresa } from "@/app/superadmin/clientes/actions";
import { PAISES } from "@/lib/paises";

export function EditarEmpresaBoton({
  tenantId,
  nombreActual,
  paisActual,
}: {
  tenantId: string;
  nombreActual: string;
  paisActual: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(nombreActual);
  const [pais, setPais] = useState(paisActual);
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      await editarEmpresa(tenantId, nombre, pais);
      setAbierto(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
      >
        Editar
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-5 shadow-2xl">
            <h2 className="font-semibold">Editar empresa</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">País</label>
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {PAISES.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending || !nombre.trim()}
                onClick={guardar}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {pending ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
