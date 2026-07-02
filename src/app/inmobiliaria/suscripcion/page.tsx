import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreditCard, Check, Users } from "lucide-react";

export default async function SuscripcionPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (!esGestor(usuario.rol)) redirect("/inmobiliaria");

  const supabase = await createClient();
  const [{ data: tenant }, { data: agentes }] = await Promise.all([
    supabase.from("tenants").select("nombre, tipo_plan").eq("id", usuario.tenant_id).single(),
    supabase.from("usuarios").select("id").eq("tenant_id", usuario.tenant_id).eq("activo", true),
  ]);

  const numAgentes = (agentes ?? []).length;
  const agentesExtra = Math.max(0, numAgentes - 2);
  const precioMensual = agentesExtra * 7.99;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <CreditCard className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Suscripción</h1>
      </div>

      {/* Plan actual */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plan actual</p>
            <p className="mt-1 text-xl font-bold capitalize">{tenant?.tipo_plan ?? "inmobiliaria"}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Activo
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
          <Users className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{numAgentes} agente{numAgentes !== 1 ? "s" : ""} activos</p>
            <p className="text-xs text-muted-foreground">
              2 incluidos gratis · {agentesExtra} adicional{agentesExtra !== 1 ? "es" : ""} × 7,99 €/mes
            </p>
          </div>
          {precioMensual > 0 && (
            <p className="ml-auto text-lg font-bold">
              {precioMensual.toFixed(2).replace(".", ",")} €<span className="text-xs font-normal text-muted-foreground">/mes</span>
            </p>
          )}
          {precioMensual === 0 && (
            <p className="ml-auto text-sm font-semibold text-emerald-600 dark:text-emerald-400">Gratuito</p>
          )}
        </div>
      </div>

      {/* Incluido en el plan */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <p className="font-semibold">Incluido en tu plan</p>
        <ul className="space-y-2">
          {[
            "Centro de Control con métricas en tiempo real",
            "Gestión de propietarios, inmuebles y compradores",
            "Visitas, agenda y seguimiento de tareas",
            "Actividad del equipo en tiempo real",
            "2 agentes incluidos sin coste",
            "Almacenamiento de documentos",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Para gestionar tu facturación o cancelar el plan, contacta con soporte en{" "}
        <a href="mailto:soporte@smartpen.es" className="text-primary hover:underline">
          soporte@smartpen.es
        </a>
      </p>
    </div>
  );
}
