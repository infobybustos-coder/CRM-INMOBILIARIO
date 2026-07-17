"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { Check, Building2, UserRound } from "lucide-react";
import { signUp } from "../actions";
import { Button } from "@/components/ui/button";
import { PAISES, prefijoPais, banderaPais } from "@/lib/paises";
import { telefonoValido, formatearMientrasEscribe } from "@/lib/telefono";
import { validarPassword } from "@/lib/validacion";
import { type TipoPlan, type PlanTarifa, type ConfigPlanes } from "@/lib/planes";

const euros = (n: number) => `${n.toFixed(2).replace(".", ",")}€`;

export function SignupWizard({
  config,
  tipoInicial,
}: {
  config: ConfigPlanes;
  tipoInicial?: TipoPlan | null;
}) {
  const [state, formAction, pending] = useActionState(signUp, null);
  const [, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [enviando, setEnviando] = useState<PlanTarifa | null>(null);
  const [errorPaso1, setErrorPaso1] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [pais, setPais] = useState("ES");
  const [telefono, setTelefono] = useState("");
  const [terminos, setTerminos] = useState(false);
  const [tipoPlan, setTipoPlan] = useState<TipoPlan>(tipoInicial ?? "asesor");

  const errorPassword = useMemo(
    () => (password ? validarPassword(password) : null),
    [password]
  );

  const planes: Record<TipoPlan, { gratis: string[]; pago: string[] }> = {
    asesor: {
      gratis: [
        `Hasta ${config.asesorFree.propietarios} propietarios`,
        `Hasta ${config.asesorFree.inmuebles} inmuebles`,
        `Hasta ${config.asesorFree.compradores} compradores`,
        "Agenda",
        "Tareas",
        "Dashboard personal",
      ],
      pago: [
        "Propietarios ilimitados",
        "Inmuebles ilimitados",
        "Compradores ilimitados",
        "Agenda",
        "Tareas",
        "Dashboard personal",
        "Rendimiento personal",
      ],
    },
    inmobiliaria: {
      gratis: [
        `Hasta ${config.inmobiliariaFree.propietarios} propietarios`,
        `Hasta ${config.inmobiliariaFree.inmuebles} inmuebles`,
        `Hasta ${config.inmobiliariaFree.compradores} compradores`,
        `${config.inmobiliariaFree.administradores} administrador`,
        `${config.inmobiliariaFree.asesores} asesores`,
      ],
      pago: [
        "Propietarios ilimitados",
        "Inmuebles ilimitados",
        "Compradores ilimitados",
        `Hasta ${config.inmobiliariaProAdminsIncluidos} administradores`,
        `Hasta ${config.inmobiliariaProAsesoresIncluidos} asesores`,
        `Administrador adicional → ${euros(config.precioAdminExtra)}/mes`,
        `Asesor adicional → ${euros(config.precioAsesorExtra)}/mes`,
        "Mensajería interna del equipo",
      ],
    },
  };

  const precioMensual: Record<TipoPlan, number> = {
    asesor: config.asesorProPrecio,
    inmobiliaria: config.inmobiliariaProPrecio,
  };

  const stripeConectado = Boolean(
    tipoPlan === "inmobiliaria" ? config.inmobiliariaProStripePriceId : config.asesorProStripePriceId
  );

  function siguientePaso1() {
    if (!nombre.trim() || !email.trim() || !password || !telefono.trim()) {
      setErrorPaso1("Rellena todos los campos obligatorios.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorPaso1("El correo electrónico no es válido.");
      return;
    }
    const errPass = validarPassword(password);
    if (errPass) {
      setErrorPaso1(errPass);
      return;
    }
    if (password !== passwordConfirmacion) {
      setErrorPaso1("Las contraseñas no coinciden.");
      return;
    }
    if (!telefonoValido(pais, telefono)) {
      setErrorPaso1("El teléfono no es válido para el país seleccionado.");
      return;
    }
    if (!terminos) {
      setErrorPaso1("Debes aceptar los Términos y Condiciones y la Política de Privacidad.");
      return;
    }
    setErrorPaso1(null);
    setStep(tipoInicial ? 3 : 2);
  }

  function enviar(planTarifa: PlanTarifa) {
    setEnviando(planTarifa);
    const fd = new FormData();
    fd.set("nombre", nombre.trim());
    fd.set("email", email.trim());
    fd.set("password", password);
    fd.set("password_confirmacion", passwordConfirmacion);
    fd.set("telefono", telefono);
    fd.set("pais", pais);
    fd.set("terminos", terminos ? "on" : "off");
    fd.set("tipo_plan", tipoPlan);
    fd.set("plan_tarifa", planTarifa);
    fd.set("metodo_pago", "Otro");
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        {step === 1 && (
          <>
            <div>
              <h1 className="text-xl font-semibold">Bienvenido 👋</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Crea tu cuenta en menos de un minuto.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nombre" className="text-sm font-medium">
                  Nombre y apellidos
                </label>
                <input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  type="text"
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                {password && errorPassword && (
                  <p className="text-xs text-muted-foreground">{errorPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password_confirmacion" className="text-sm font-medium">
                  Confirmar contraseña
                </label>
                <input
                  id="password_confirmacion"
                  value={passwordConfirmacion}
                  onChange={(e) => setPasswordConfirmacion(e.target.value)}
                  type="password"
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
                  <span className="rounded-md border bg-muted px-3 py-2 text-sm">
                    {prefijoPais(pais)}
                  </span>
                  <input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(formatearMientrasEscribe(pais, e.target.value))}
                    type="tel"
                    required
                    placeholder="600 000 000"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={terminos}
                  onChange={(e) => setTerminos(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Acepto los{" "}
                  <Link href="/terminos" target="_blank" className="underline">
                    Términos y Condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" target="_blank" className="underline">
                    Política de Privacidad
                  </Link>
                  .
                </span>
              </label>

              {errorPaso1 && <p className="text-sm text-destructive">{errorPaso1}</p>}

              <Button type="button" onClick={siguientePaso1} className="w-full">
                Crear cuenta
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-xl font-semibold">Bienvenido 👋</h1>
              <p className="mt-1 text-sm text-muted-foreground">¿Cómo vas a utilizar el CRM?</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setTipoPlan("asesor");
                  setStep(3);
                }}
                className="w-full rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <UserRound className="size-4" /> Agente Inmobiliario
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Trabajo por mi cuenta y gestiono mi propio negocio.
                </p>
                <span className="mt-2 inline-block text-sm font-medium text-primary">Seleccionar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoPlan("inmobiliaria");
                  setStep(3);
                }}
                className="w-full rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Building2 className="size-4" /> Inmobiliaria
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tengo una inmobiliaria y un equipo de asesores.
                </p>
                <span className="mt-2 inline-block text-sm font-medium text-primary">Seleccionar</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Volver
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-xl font-semibold">Elige cómo empezar</h1>

            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">🆓 Plan Gratuito</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ideal para {tipoPlan === "inmobiliaria" ? "probar" : "conocer"} el CRM.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {planes[tipoPlan].gratis.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> {c}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  onClick={() => enviar("gratis")}
                  disabled={pending}
                  className="mt-4 w-full"
                >
                  {pending && enviando === "gratis" ? "Creando cuenta..." : "Empezar gratis"}
                </Button>
              </div>

              <div className="rounded-lg border border-primary bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">⭐ Plan Profesional</h2>
                  <span className="text-sm font-semibold">{euros(precioMensual[tipoPlan])}/mes</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {planes[tipoPlan].pago.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" /> {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  {stripeConectado
                    ? "Al confirmar te llevamos directamente a la pasarela de pago segura."
                    : "Todavía no hay una pasarela de pago automática conectada. Tu cuenta se crea en Gratis y pasa a Profesional en cuanto confirmemos el pago contigo."}
                </p>
                <Button
                  type="button"
                  onClick={() => enviar("pago")}
                  disabled={pending}
                  className="mt-3 w-full"
                >
                  {pending && enviando === "pago" ? "Creando cuenta..." : "Solicitar Profesional"}
                </Button>
              </div>
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <button
              type="button"
              onClick={() => setStep(tipoInicial ? 1 : 2)}
              disabled={pending}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              ← Volver
            </button>
          </>
        )}
      </div>
    </div>
  );
}
