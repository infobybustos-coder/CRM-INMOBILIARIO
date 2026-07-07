"use client";

import { useRef, useTransition } from "react";
import { agregarNota } from "@/app/superadmin/clientes/actions";

type Nota = { id: string; texto: string; creado_por: string | null; creado_en: string };

export function NotasInternas({ tenantId, notas }: { tenantId: string; notas: Nota[] }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function enviar(formData: FormData) {
    const texto = String(formData.get("texto") ?? "");
    if (!texto.trim()) return;
    startTransition(async () => {
      await agregarNota(tenantId, texto);
      formRef.current?.reset();
    });
  }

  return (
    <div className="space-y-3">
      <form ref={formRef} action={enviar} className="flex gap-2">
        <input
          name="texto"
          type="text"
          placeholder="Añadir una nota interna..."
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "..." : "Añadir"}
        </button>
      </form>

      {notas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin notas todavía.</p>
      ) : (
        <ul className="space-y-2">
          {notas.map((n) => (
            <li key={n.id} className="rounded-md border p-2.5 text-sm">
              <p>{n.texto}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {n.creado_por ?? "Superadmin"} ·{" "}
                {new Date(n.creado_en).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
