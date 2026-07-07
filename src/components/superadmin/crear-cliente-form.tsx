"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { crearTenantManual, type CrearClienteState } from "@/app/superadmin/clientes/nuevo/actions";
import { PAISES, prefijoPais, banderaPais } from "@/lib/paises";
import { formatearMientrasEscribe } from "@/lib/telefono";
import { METODOS_PAGO } from "@/lib/metodos-pago";

export function CrearClienteForm() {
  const [state, formAction, pending] = useActionState<CrearClienteState, FormData>(
    crearTenantManual,
    null
  );
  const [pais, setPais] = useState("ES");
  const [telefono, setTelefono] = useState("");
  const [planTarifa, setPlanTarifa] = useState("gratis");
  const [copiado, setCopiado] = useState(false);

  if (state && "ok" in state) {
    return (
      <div className="max-w-md space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Cliente creado</h2>
        <p className="text-sm text-muted-foreground">
          Comparte esta contraseña temporal con el cliente para que inicie sesión — no volverá a
          mostrarse.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={state.password}
            onFocus={(e) => e.target.select()}
            className="flex-1 rounded-md border bg-muted px-2.5 py-1.5 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(state.password);
              setCopiado(true);
            }}
            className="shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            {copiado ? "Copiada" : "Copiar"}
          </button>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/superadmin/clientes/${state.tenantId}`}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Ver ficha del cliente
          </Link>
          <Link
            href="/superadmin/clientes"
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Volver a Clientes
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="tipo_plan" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="tipo_plan"
            name="tipo_plan"
            defaultValue="asesor"
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="asesor">Asesor</option>
            <option value="inmobiliaria">Inmobiliaria</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="plan_tarifa" className="text-sm font-medium">
            Plan
          </label>
          <select
            id="plan_tarifa"
            name="plan_tarifa"
            value={planTarifa}
            onChange={(e) => setPlanTarifa(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="gratis">Gratis</option>
            <option value="pago">PRO</option>
          </select>
        </div>
      </div>

      {planTarifa === "pago" && (
        <div className="space-y-2">
          <label htmlFor="metodo_pago" className="text-sm font-medium">
            Método de pago recibido
          </label>
          <select
            id="metodo_pago"
            name="metodo_pago"
            defaultValue={METODOS_PAGO[0]}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear cliente"}
      </button>
    </form>
  );
}
