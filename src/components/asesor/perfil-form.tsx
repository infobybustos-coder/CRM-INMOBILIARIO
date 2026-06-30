"use client";

import { useActionState, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { actualizarPerfil, actualizarAvatar, type PerfilState } from "@/app/asesor/perfil/actions";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function PerfilForm({
  usuarioId,
  nombreCompleto,
  email,
  telefono,
  bio,
  avatarUrl,
}: {
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  bio: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<PerfilState, FormData>(
    actualizarPerfil,
    null
  );
  const [avatar, setAvatar] = useState(avatarUrl);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function subirAvatar(file: File) {
    setSubiendo(true);
    const supabase = createClient();
    const ruta = `${usuarioId}/avatar_${Date.now()}_${file.name}`;

    const { error } = await supabase.storage.from("avatares").upload(ruta, file, {
      upsert: true,
    });

    if (!error) {
      const { data } = supabase.storage.from("avatares").getPublicUrl(ruta);
      setAvatar(data.publicUrl);
      await actualizarAvatar(ruta);
    }
    setSubiendo(false);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-semibold text-primary-foreground"
          aria-label="Cambiar foto de perfil"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            iniciales(nombreCompleto || email)
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
            if (file) subirAvatar(file);
          }}
        />
        <div>
          <p className="text-sm font-medium">{nombreCompleto || "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
          {subiendo && <p className="text-xs text-muted-foreground">Subiendo foto...</p>}
        </div>
      </div>

      <form action={formAction} className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Mis datos</h2>

        <div className="space-y-2">
          <label htmlFor="nombre_completo" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="nombre_completo"
            name="nombre_completo"
            defaultValue={nombreCompleto}
            required
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
          <label htmlFor="bio" className="text-sm font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={bio ?? ""}
            placeholder="Cuéntanos algo sobre ti como asesor..."
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {state && "error" in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state && "ok" in state && (
          <p className="text-sm text-emerald-600">Perfil actualizado.</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
