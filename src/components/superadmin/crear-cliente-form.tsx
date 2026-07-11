"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { invitarClienteManual, type CrearClienteState } from "@/app/superadmin/clientes/nuevo/actions";
import { PAISES, prefijoPais, banderaPais } from "@/lib/paises";
import { formatearMientrasEscribe } from "@/lib/telefono";
import { WhatsAppBoton } from "@/components/superadmin/whatsapp-boton";

export function CrearClienteForm() {
  const [state, formAction, pending] = useActionState<CrearClienteState, FormData>(
    invitarClienteManual,
    null
  );
  const [pais, setPais] = useState("ES");
  const [telefono, setTelefono] = useState("");
  const [copiado, setCopiado] = useState(false);

  if (state && "ok" in state) {
    const mensajeWhatsapp = state.link
      ? `Hola, para completar el alta en CRM Inmobiliario entra aquí y dinos si eres asesor o inmobiliaria: ${state.link}`
      : undefined;

    return (
      <div className="max-w-md space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Invitación enviada</h2>
        <p className="text-sm text-muted-foreground">
          Le hemos mandado un email al cliente para que complete su registro: elige él mismo si es
          Asesor o Inmobiliaria y su plan, igual que en el alta pública.
        </p>

        {state.link && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              También puedes compartir el mismo enlace a mano:
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={state.link}
                className="w-full min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(state.link!);
                  setCopiado(true);
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
                aria-label="Copiar enlace"
              >
                {copiado ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </button>
            </div>
            <WhatsAppBoton telefono={state.telefono} mensaje={mensajeWhatsapp} etiqueta="Enviar por WhatsApp" />
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href="/superadmin/clientes"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Volver a Clientes
          </Link>
          <Link
            href="/superadmin/clientes/nuevo"
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Invitar a otro cliente
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-lg border p-6">
      <div className="space-y-2">
        <label htmlFor="nombre_empresa" className="text-sm font-medium">
          Nombre de la empresa
        </label>
        <input
          id="nombre_empresa"
          name="nombre_empresa"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="nombre_contacto" className="text-sm font-medium">
          Nombre del contacto
        </label>
        <input
          id="nombre_contacto"
          name="nombre_contacto"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
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
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="pais" className="text-sm font-medium">
          País
        </label>
        <select
          id="pais"
          name="pais"
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          {PAISES.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {banderaPais(p.codigo)} {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="telefono" className="text-sm font-medium">
          Teléfono
        </label>
        <div className="flex items-center gap-2">
          <span className="rounded-md border bg-muted px-3 py-2 text-sm">{prefijoPais(pais)}</span>
          <input
            id="telefono"
            name="telefono"
            value={telefono}
            onChange={(e) => setTelefono(formatearMientrasEscribe(pais, e.target.value))}
            type="tel"
            required
            placeholder="600 000 000"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando invitación..." : "Enviar invitación"}
      </button>
    </form>
  );
}
