"use client";

import { useActionState, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { actualizarEmpresa, actualizarLogo, type EmpresaState } from "@/app/inmobiliaria/empresa/actions";

export function FormularioEmpresa({
  tenantId,
  nombre,
  cifNif,
  telefono,
  email,
  direccion,
  web,
  zonaHoraria,
  logoUrl,
}: {
  tenantId: string;
  nombre: string;
  cifNif: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  web: string | null;
  zonaHoraria: string | null;
  logoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<EmpresaState, FormData>(actualizarEmpresa, null);
  const [logo, setLogo] = useState(logoUrl);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function subirLogo(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const ruta = `${tenantId}/logo_${Date.now()}_${file.name}`;

    const { error } = await supabase.storage.from("logos").upload(ruta, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from("logos").getPublicUrl(ruta);
      setLogo(data.publicUrl);
      await actualizarLogo(ruta);
    }
    setSubiendo(false);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10"
          aria-label="Cambiar logo"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="size-full object-cover" />
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
          <p className="text-sm font-medium">Logo de la empresa</p>
          <p className="text-xs text-muted-foreground">
            {subiendo ? "Subiendo..." : "Haz clic en el recuadro para cambiarlo"}
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">
            Nombre de la empresa
          </label>
          <input
            id="nombre"
            name="nombre"
            defaultValue={nombre}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="cif_nif" className="text-sm font-medium">
              CIF/NIF
            </label>
            <input
              id="cif_nif"
              name="cif_nif"
              defaultValue={cifNif ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="telefono" className="text-sm font-medium">
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              defaultValue={telefono ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={email ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="web" className="text-sm font-medium">
              Página web
            </label>
            <input
              id="web"
              name="web"
              type="url"
              placeholder="https://..."
              defaultValue={web ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="direccion" className="text-sm font-medium">
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            defaultValue={direccion ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="zona_horaria" className="text-sm font-medium">
            Zona horaria
          </label>
          <input
            id="zona_horaria"
            name="zona_horaria"
            placeholder="Europe/Madrid"
            defaultValue={zonaHoraria ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
        {state && "ok" in state && <p className="text-sm text-emerald-600">Guardado.</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
