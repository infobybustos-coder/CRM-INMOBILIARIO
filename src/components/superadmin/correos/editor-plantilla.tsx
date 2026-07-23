"use client";

import { useActionState, useRef, useState } from "react";
import { guardarPlantilla, enviarPlantillaPrueba, type GuardarPlantillaState } from "@/app/superadmin/correos/actions";
import { construirHtmlCorreo, sustituirVariables, urlPublicaLogo } from "@/lib/correos/render";
import type { ConfigCorreos, PlantillaEmail } from "@/lib/correos/tipos";

const VARIABLES_EJEMPLO: Record<string, string> = {
  nombre: "Nombre de ejemplo",
  empresa: "Empresa de ejemplo",
  email: "ejemplo@correo.com",
  plan: "Plan Asesor PRO",
  fecha: new Date().toLocaleDateString("es-ES"),
  recurso: "propietarios",
  porcentaje: "80",
  app_url: "https://ambraio.com",
  enlace: "#",
};

export function EditorPlantilla({ plantilla, config }: { plantilla: PlantillaEmail; config: ConfigCorreos }) {
  const [state, formAction, pending] = useActionState<GuardarPlantillaState, FormData>(guardarPlantilla, null);
  const [asunto, setAsunto] = useState(plantilla.asunto);
  const [contenido, setContenido] = useState(plantilla.contenidoHtml);
  const [botonTexto, setBotonTexto] = useState(plantilla.botonTexto ?? "");
  const [botonUrl, setBotonUrl] = useState(plantilla.botonUrl ?? "");
  const [emailPrueba, setEmailPrueba] = useState("");
  const [pruebaEstado, setPruebaEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const contenidoRef = useRef<HTMLTextAreaElement>(null);

  function insertarVariable(variable: string) {
    const etiqueta = `{{${variable}}}`;
    const textarea = contenidoRef.current;
    if (!textarea) {
      setContenido((c) => c + etiqueta);
      return;
    }
    const inicio = textarea.selectionStart ?? contenido.length;
    const fin = textarea.selectionEnd ?? contenido.length;
    const nuevo = contenido.slice(0, inicio) + etiqueta + contenido.slice(fin);
    setContenido(nuevo);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = inicio + etiqueta.length;
    });
  }

  const previewHtml = construirHtmlCorreo({
    contenidoHtml: sustituirVariables(contenido, VARIABLES_EJEMPLO),
    botonTexto: botonTexto ? sustituirVariables(botonTexto, VARIABLES_EJEMPLO) : null,
    botonUrl: botonUrl ? sustituirVariables(botonUrl, VARIABLES_EJEMPLO) : null,
    colorPrincipal: config.colorPrincipal,
    logoUrl: urlPublicaLogo(config.logoUrl),
    firma: config.firma,
  });

  async function enviarPrueba() {
    if (!emailPrueba) return;
    setPruebaEstado("enviando");
    const res = await enviarPlantillaPrueba(plantilla.clave, emailPrueba);
    setPruebaEstado("ok" in res ? "ok" : "error");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="clave" value={plantilla.clave} />
        <div className="space-y-3 rounded-lg border p-4">
          <div>
            <h2 className="font-semibold">{plantilla.nombre}</h2>
            {plantilla.descripcion && <p className="text-xs text-muted-foreground">{plantilla.descripcion}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activo" defaultChecked={plantilla.activo} className="size-4" />
            Enviar este correo automáticamente
          </label>

          <div className="space-y-1">
            <label htmlFor="asunto" className="text-xs font-medium text-muted-foreground">
              Asunto
            </label>
            <input
              id="asunto"
              name="asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              required
              className="w-full rounded-md border px-2.5 py-1.5 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="contenido_html" className="text-xs font-medium text-muted-foreground">
              Contenido (HTML)
            </label>
            <textarea
              ref={contenidoRef}
              id="contenido_html"
              name="contenido_html"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              required
              rows={12}
              className="w-full rounded-md border px-2.5 py-1.5 font-mono text-xs"
            />
            {plantilla.variablesDisponibles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {plantilla.variablesDisponibles.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertarVariable(v)}
                    className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="boton_texto" className="text-xs font-medium text-muted-foreground">
                Texto del botón (opcional)
              </label>
              <input
                id="boton_texto"
                name="boton_texto"
                value={botonTexto}
                onChange={(e) => setBotonTexto(e.target.value)}
                className="w-full rounded-md border px-2.5 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="boton_url" className="text-xs font-medium text-muted-foreground">
                URL del botón
              </label>
              <input
                id="boton_url"
                name="boton_url"
                value={botonUrl}
                onChange={(e) => setBotonUrl(e.target.value)}
                className="w-full rounded-md border px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>

          {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
          {state && "ok" in state && <p className="text-sm text-emerald-600">Guardado.</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Guardando..." : "Guardar plantilla"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">Vista previa (con datos de ejemplo)</p>
          <div className="overflow-hidden rounded-md border">
            <iframe title="Vista previa del correo" srcDoc={previewHtml} className="h-[420px] w-full bg-white" />
          </div>
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">Enviar correo de prueba</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailPrueba}
              onChange={(e) => setEmailPrueba(e.target.value)}
              placeholder="tu@email.com"
              className="flex-1 rounded-md border px-2.5 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={enviarPrueba}
              disabled={pruebaEstado === "enviando" || !emailPrueba}
              className="shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              {pruebaEstado === "enviando" ? "Enviando..." : "Enviar prueba"}
            </button>
          </div>
          {pruebaEstado === "ok" && <p className="text-xs text-emerald-600">Correo de prueba enviado.</p>}
          {pruebaEstado === "error" && (
            <p className="text-xs text-destructive">No se pudo enviar (¿está configurado Resend?).</p>
          )}
        </div>
      </div>
    </div>
  );
}
