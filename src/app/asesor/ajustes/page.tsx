import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AjustesForm } from "@/components/asesor/ajustes-form";
import { LIMITES_GRATIS, esIlimitado, etiquetaPlan, precioPlan, type TipoPlan } from "@/lib/planes";

export default async function AjustesPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const ilimitado = esIlimitado(usuario.tenant ?? {});
  const limites = LIMITES_GRATIS[(usuario.tenant?.tipo_plan as TipoPlan) ?? "asesor"];

  const [{ count: propietarios }, { count: inmuebles }, { count: compradores }] = ilimitado
    ? [{ count: null }, { count: null }, { count: null }]
    : await Promise.all([
        supabase
          .from("propietarios")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", usuario.tenant_id),
        supabase
          .from("inmuebles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", usuario.tenant_id),
        supabase
          .from("compradores")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", usuario.tenant_id),
      ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ajustes</h1>

      <div className="max-w-lg rounded-lg border p-4">
        <h2 className="text-sm font-medium">Tu plan</h2>
        <p className="mt-1 text-lg font-semibold">
          {etiquetaPlan(usuario.tenant ?? {})}
          {ilimitado && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {precioPlan(usuario.tenant ?? {}).toFixed(2)}€/mes
            </span>
          )}
        </p>
        {ilimitado ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Captaciones, inmuebles y compradores ilimitados.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>
              Captaciones: {propietarios ?? 0} / {limites.propietarios}
            </li>
            <li>
              Inmuebles: {inmuebles ?? 0} / {limites.inmuebles}
            </li>
            <li>
              Compradores: {compradores ?? 0} / {limites.compradores}
            </li>
          </ul>
        )}
      </div>

      <AjustesForm
        monedaInicial={(usuario.moneda as "EUR" | "USD") ?? "EUR"}
        idiomaInicial={(usuario.idioma as "es" | "en") ?? "es"}
      />
    </div>
  );
}
