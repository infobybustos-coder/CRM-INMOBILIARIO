"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, X, Copy, Check, Lock } from "lucide-react";
import { invitarMiembro, type InvitarState, type RolInvitable } from "@/app/inmobiliaria/equipo/actions";

export function NuevoMiembro({
  rol: rolFijo,
  etiqueta,
}: {
  rol?: RolInvitable;
  etiqueta: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const [rolElegido, setRolElegido] = useState<RolInvitable>("empleado");
  const [estado, setEstado] = useState<InvitarState>(null);
  const [pending, startTransition] = useTransition();
  const [copiado, setCopiado] = useState(false);
  const rol = rolFijo ?? rolElegido;

  function enviar(confirmarExtra: boolean) {
    const formData = new FormData();
    formData.set("email", email);
    formData.set("confirmarExtra", confirmarExtra ? "true" : "false");
    startTransition(async () => {
      const resultado = await invitarMiembro(rol, null, formData);
      setEstado(resultado);
    });
  }

  function cerrar() {
    setAbierto(false);
    setEmail("");
    setRolElegido("empleado");
    setEstado(null);
    setCopiado(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo {etiqueta}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Invitar {rolFijo ? etiqueta : "usuario"}</h2>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {estado && "ok" in estado ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-600">
                  Invitación creada. Copia el enlace y envíaselo por el medio que prefieras:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={estado.link}
                    className="w-full min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(estado.link);
                      setCopiado(true);
                    }}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md border hover:bg-accent"
                    aria-label="Copiar enlace"
                  >
                    {copiado ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={cerrar}
                  className="w-full rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  Cerrar
                </button>
              </div>
            ) : estado && "requierePlanPro" in estado ? (
              <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <p className="flex items-start gap-2">
                  <Lock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  Con el plan Free no puedes añadir más{" "}
                  {rol === "admin" ? "administradores" : "asesores"} de los incluidos. Para añadir
                  usuarios extra, necesitas pasarte al plan PRO.
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/inmobiliaria/suscripcion"
                    className="flex-1 rounded-md bg-primary px-3 py-1.5 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Ver plan PRO
                  </Link>
                  <button
                    type="button"
                    onClick={cerrar}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : estado && "requierePago" in estado ? (
              <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <p>
                  Ya tienes el máximo de {rol === "admin" ? "administradores" : "asesores"} incluidos en tu
                  plan. Añadir uno más cuesta{" "}
                  <span className="font-semibold">{estado.precio.toFixed(2).replace(".", ",")}€/mes</span>.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => enviar(true)}
                    className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {pending ? "Añadiendo..." : "Añadir a mi plan e invitar"}
                  </button>
                  <button
                    type="button"
                    onClick={cerrar}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="email-nuevo-miembro" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email-nuevo-miembro"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                {!rolFijo && (
                  <div className="space-y-1.5">
                    <label htmlFor="rol-nuevo-miembro" className="text-sm font-medium">
                      Rol
                    </label>
                    <select
                      id="rol-nuevo-miembro"
                      value={rolElegido}
                      onChange={(e) => setRolElegido(e.target.value as RolInvitable)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="empleado">Asesor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                )}
                {estado && "error" in estado && <p className="text-sm text-destructive">{estado.error}</p>}
                <button
                  type="button"
                  disabled={pending || !email.trim()}
                  onClick={() => enviar(false)}
                  className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? "Enviando..." : "Invitar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
