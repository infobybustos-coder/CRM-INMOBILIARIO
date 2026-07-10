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

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">{titulo}</h3>
      {children}
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
      <Seccion titulo="Insignia y barra de confianza">
        <Campo label="Insignia (sobre el título)" name="badge_texto" valorInicial={config.badgeTexto} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo label="Confianza 1" name="trust_1" valorInicial={config.trust1} />
          <Campo label="Confianza 2" name="trust_2" valorInicial={config.trust2} />
          <Campo label="Confianza 3" name="trust_3" valorInicial={config.trust3} />
        </div>
      </Seccion>

      <Seccion titulo="Héroe (lo primero que se ve)">
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
      </Seccion>

      <Seccion titulo="Accesos rápidos (Asesor / Inmobiliaria)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Título Asesor" name="quick_asesor_titulo" valorInicial={config.quickAsesorTitulo} />
          <Campo
            label="Descripción Asesor"
            name="quick_asesor_descripcion"
            valorInicial={config.quickAsesorDescripcion}
          />
          <Campo
            label="Título Inmobiliaria"
            name="quick_inmobiliaria_titulo"
            valorInicial={config.quickInmobiliariaTitulo}
          />
          <Campo
            label="Descripción Inmobiliaria"
            name="quick_inmobiliaria_descripcion"
            valorInicial={config.quickInmobiliariaDescripcion}
          />
        </div>
      </Seccion>

      <Seccion titulo="¿Te suena esto? (problemas que resuelve)">
        <Campo label="Título de la sección" name="problema_titulo" valorInicial={config.problemaTitulo} />
        <Campo label="Problema 1" name="problema_1" valorInicial={config.problema1} />
        <Campo label="Problema 2" name="problema_2" valorInicial={config.problema2} />
        <Campo label="Problema 3" name="problema_3" valorInicial={config.problema3} />
        <Campo label="Problema 4" name="problema_4" valorInicial={config.problema4} />
        <Campo label="Frase de cierre" name="transicion_texto" valorInicial={config.transicionTexto} />
      </Seccion>

      <Seccion titulo="Características (3 tarjetas)">
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
      </Seccion>

      <Seccion titulo="Módulos del producto (6 tarjetas)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Título de la sección" name="modulo_titulo" valorInicial={config.moduloTitulo} />
          <Campo label="Subtítulo de la sección" name="modulo_subtitulo" valorInicial={config.moduloSubtitulo} />
        </div>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <Campo
              label={`Título ${n}`}
              name={`modulo_${n}_titulo`}
              valorInicial={config[`modulo${n}Titulo` as keyof LandingConfig] as string}
            />
            <Campo
              label={`Descripción ${n}`}
              name={`modulo_${n}_descripcion`}
              valorInicial={config[`modulo${n}Descripcion` as keyof LandingConfig] as string}
            />
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Cómo funciona (3 pasos)">
        <Campo label="Título de la sección" name="pasos_titulo" valorInicial={config.pasosTitulo} />
        {[1, 2, 3].map((n) => (
          <div key={n} className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <Campo
              label={`Título paso ${n}`}
              name={`paso_${n}_titulo`}
              valorInicial={config[`paso${n}Titulo` as keyof LandingConfig] as string}
            />
            <Campo
              label={`Descripción paso ${n}`}
              name={`paso_${n}_descripcion`}
              valorInicial={config[`paso${n}Descripcion` as keyof LandingConfig] as string}
            />
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Planes (cabecera de la sección)">
        <Campo label="Título" name="planes_titulo" valorInicial={config.planesTitulo} />
        <Campo label="Subtítulo" name="planes_subtitulo" valorInicial={config.planesSubtitulo} />
        <p className="text-xs text-muted-foreground">
          Los precios y límites de cada plan se editan en Suscripciones, no aquí.
        </p>
      </Seccion>

      <Seccion titulo="Preguntas frecuentes (5)">
        <Campo label="Título de la sección" name="faq_titulo" valorInicial={config.faqTitulo} />
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="space-y-3 border-t pt-3">
            <Campo
              label={`Pregunta ${n}`}
              name={`faq_${n}_pregunta`}
              valorInicial={config[`faq${n}Pregunta` as keyof LandingConfig] as string}
            />
            <Campo
              label={`Respuesta ${n}`}
              name={`faq_${n}_respuesta`}
              valorInicial={config[`faq${n}Respuesta` as keyof LandingConfig] as string}
              multilinea
            />
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Llamada a la acción final">
        <Campo label="Título" name="cta_final_titulo" valorInicial={config.ctaFinalTitulo} />
        <Campo label="Subtítulo" name="cta_final_subtitulo" valorInicial={config.ctaFinalSubtitulo} />
      </Seccion>

      <div className="sticky bottom-4 space-y-1 rounded-lg border bg-card p-3 shadow-lg">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
        {state && "ok" in state && <p className="text-sm text-emerald-600">Guardado — ya está en la web.</p>}
      </div>
    </form>
  );
}
