"use client";

import { useActionState } from "react";
import { guardarLandingConfig, type GuardarLandingState } from "@/app/superadmin/landing/actions";
import { type LandingConfig } from "@/lib/landing-config";

function Campo({
  label,
  name,
  valorInicial,
  multilinea,
}: {
  label: string;
  name: string;
  valorInicial: string;
  multilinea?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {multilinea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={valorInicial}
          required
          rows={2}
          className="w-full rounded-md border px-2.5 py-1.5 text-sm"
        />
      ) : (
        <input
          id={name}
          name={name}
          defaultValue={valorInicial}
          required
          className="w-full rounded-md border px-2.5 py-1.5 text-sm"
        />
      )}
    </div>
  );
}

export function LandingEditor({ config }: { config: LandingConfig }) {
  const [state, formAction, pending] = useActionState<GuardarLandingState, FormData>(
    guardarLandingConfig,
    null
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Héroe (lo primero que se ve)</h3>
        <Campo label="Título" name="hero_titulo" valorInicial={config.heroTitulo} multilinea />
        <Campo label="Subtítulo" name="hero_subtitulo" valorInicial={config.heroSubtitulo} multilinea />
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Botón principal" name="hero_cta_principal" valorInicial={config.heroCtaPrincipal} />
          <Campo
            label="Botón secundario"
            name="hero_cta_secundario"
            valorInicial={config.heroCtaSecundario}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Características (3 tarjetas)</h3>
        {[1, 2, 3].map((n) => (
          <div key={n} className="grid gap-3 border-t pt-3 first:border-t-0 first:pt-0 sm:grid-cols-2">
            <Campo
              label={`Título ${n}`}
              name={`caracteristica_${n}_titulo`}
              valorInicial={config[`caracteristica${n}Titulo` as keyof LandingConfig] as string}
            />
            <Campo
              label={`Descripción ${n}`}
              name={`caracteristica_${n}_descripcion`}
              valorInicial={config[`caracteristica${n}Descripcion` as keyof LandingConfig] as string}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Llamada a la acción final</h3>
        <Campo label="Título" name="cta_final_titulo" valorInicial={config.ctaFinalTitulo} />
        <Campo label="Subtítulo" name="cta_final_subtitulo" valorInicial={config.ctaFinalSubtitulo} />
      </div>

      <div className="space-y-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
        {state && "ok" in state && <p className="text-sm text-emerald-600">Guardado — ya está en la web.</p>}
      </div>
    </form>
  );
}
