"use client";

import { useActionState } from "react";
import {
  guardarAsesorFree,
  guardarAsesorPro,
  guardarInmobiliariaFree,
  guardarInmobiliariaPro,
  type GuardarConfigState,
} from "@/app/superadmin/suscripciones/actions";
import { type ConfigPlanes } from "@/lib/planes";

function Campo({
  label,
  name,
  valorInicial,
  step = 1,
}: {
  label: string;
  name: string;
  valorInicial: number;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min={0}
        step={step}
        defaultValue={valorInicial}
        required
        className="w-full rounded-md border px-2.5 py-1.5 text-sm"
      />
    </div>
  );
}

function CampoTexto({
  label,
  name,
  valorInicial,
  placeholder,
}: {
  label: string;
  name: string;
  valorInicial: string | null;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={valorInicial ?? ""}
        placeholder={placeholder}
        className="w-full rounded-md border px-2.5 py-1.5 font-mono text-sm"
      />
    </div>
  );
}

function BotonGuardar({ pending, state }: { pending: boolean; state: GuardarConfigState }) {
  return (
    <div className="space-y-1">
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}
      {state && "ok" in state && <p className="text-xs text-emerald-600">Guardado.</p>}
    </div>
  );
}

export function ConfigPlanesEditor({ config }: { config: ConfigPlanes }) {
  const [asesorFreeState, asesorFreeAction, asesorFreePending] = useActionState(guardarAsesorFree, null);
  const [asesorProState, asesorProAction, asesorProPending] = useActionState(guardarAsesorPro, null);
  const [inmoFreeState, inmoFreeAction, inmoFreePending] = useActionState(guardarInmobiliariaFree, null);
  const [inmoProState, inmoProAction, inmoProPending] = useActionState(guardarInmobiliariaPro, null);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <form action={asesorFreeAction} className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Plan Asesor Free</h3>
        <Campo label="Propietarios" name="propietarios" valorInicial={config.asesorFree.propietarios} />
        <Campo label="Inmuebles" name="inmuebles" valorInicial={config.asesorFree.inmuebles} />
        <Campo label="Compradores" name="compradores" valorInicial={config.asesorFree.compradores} />
        <BotonGuardar pending={asesorFreePending} state={asesorFreeState} />
      </form>

      <form action={asesorProAction} className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Plan Asesor PRO</h3>
        <Campo label="Precio (€/mes)" name="precio" valorInicial={config.asesorProPrecio} step={0.01} />
        <CampoTexto
          label="Stripe Price ID"
          name="stripe_price_id"
          valorInicial={config.asesorProStripePriceId}
          placeholder="price_..."
        />
        <p className="text-xs text-muted-foreground">
          Propietarios, inmuebles y compradores: ilimitados (no editable).
        </p>
        <BotonGuardar pending={asesorProPending} state={asesorProState} />
      </form>

      <form action={inmoFreeAction} className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Plan Inmobiliaria Free</h3>
        <Campo label="Propietarios" name="propietarios" valorInicial={config.inmobiliariaFree.propietarios} />
        <Campo label="Inmuebles" name="inmuebles" valorInicial={config.inmobiliariaFree.inmuebles} />
        <Campo label="Compradores" name="compradores" valorInicial={config.inmobiliariaFree.compradores} />
        <Campo
          label="Administradores"
          name="administradores"
          valorInicial={config.inmobiliariaFree.administradores}
        />
        <Campo label="Asesores" name="asesores" valorInicial={config.inmobiliariaFree.asesores} />
        <BotonGuardar pending={inmoFreePending} state={inmoFreeState} />
      </form>

      <form action={inmoProAction} className="space-y-3 rounded-lg border p-4">
        <h3 className="font-semibold">Plan Inmobiliaria PRO</h3>
        <Campo label="Precio (€/mes)" name="precio" valorInicial={config.inmobiliariaProPrecio} step={0.01} />
        <Campo
          label="Administradores incluidos"
          name="administradores_incluidos"
          valorInicial={config.inmobiliariaProAdminsIncluidos}
        />
        <Campo
          label="Asesores incluidos"
          name="asesores_incluidos"
          valorInicial={config.inmobiliariaProAsesoresIncluidos}
        />
        <Campo
          label="Administrador adicional (€/mes)"
          name="precio_admin_extra"
          valorInicial={config.precioAdminExtra}
          step={0.01}
        />
        <Campo
          label="Asesor adicional (€/mes)"
          name="precio_asesor_extra"
          valorInicial={config.precioAsesorExtra}
          step={0.01}
        />
        <CampoTexto
          label="Stripe Price ID"
          name="stripe_price_id"
          valorInicial={config.inmobiliariaProStripePriceId}
          placeholder="price_..."
        />
        <p className="text-xs text-muted-foreground">
          Propietarios, inmuebles y compradores: ilimitados (no editable).
        </p>
        <BotonGuardar pending={inmoProPending} state={inmoProState} />
      </form>
    </div>
  );
}
