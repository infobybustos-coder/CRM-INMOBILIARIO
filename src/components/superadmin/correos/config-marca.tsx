"use client";

import { useActionState, useRef, useState } from "react";
import { Camera } from "lucide-react";
import {
  guardarConfigCorreos,
  subirLogoCorreo,
  type GuardarConfigCorreosState,
} from "@/app/superadmin/correos/actions";
import { urlPublicaLogo } from "@/lib/correos/render";
import type { ConfigCorreos } from "@/lib/correos/tipos";

export function ConfigMarca({ config }: { config: ConfigCorreos }) {
  const [state, formAction, pending] = useActionState<GuardarConfigCorreosState, FormData>(
    guardarConfigCorreos,
    null
  );
  const [logoUrl, setLogoUrl] = useState(urlPublicaLogo(config.logoUrl));
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function subirLogo(file: File) {
    setSubiendo(true);
    const formData = new FormData();
    formData.append("archivo", file);
    const res = await subirLogoCorreo(formData);
    if ("ok" in res) setLogoUrl(res.url);
    setSubiendo(false);
  }

  return (
    <div className="max-w-lg space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10"
          aria-label="Cambiar logo"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-full object-contain" />
          ) : (
            <Camera className="size-6 text-muted-foreground" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-5 text-white" />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) subirLogo(file);
          }}
        />
        <div>
          <p className="text-sm font-medium">Logo</p>
          <p className="text-xs text-muted-foreground">{subiendo ? "Subiendo..." : "Haz clic para cambiarlo"}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="color_principal" className="text-xs font-medium text-muted-foreground">
              Color principal
            </label>
            <input
              id="color_principal"
              name="color_principal"
              type="color"
              defaultValue={config.colorPrincipal}
              className="h-9 w-full rounded-md border px-1"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="remitente_nombre" className="text-xs font-medium text-muted-foreground">
              Nombre del remitente
            </label>
            <input
              id="remitente_nombre"
              name="remitente_nombre"
              defaultValue={config.remitenteNombre}
              required
              className="w-full rounded-md border px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="remitente_email" className="text-xs font-medium text-muted-foreground">
              Email del remitente
            </label>
            <input
              id="remitente_email"
              name="remitente_email"
              type="email"
              defaultValue={config.remitenteEmail}
              required
              className="w-full rounded-md border px-2.5 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="firma" className="text-xs font-medium text-muted-foreground">
            Firma
          </label>
          <input
            id="firma"
            name="firma"
            defaultValue={config.firma}
            required
            className="w-full rounded-md border px-2.5 py-1.5 text-sm"
          />
        </div>

        {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
        {state && "ok" in state && <p className="text-sm text-emerald-600">Guardado.</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar marca"}
        </button>
      </form>
    </div>
  );
}
