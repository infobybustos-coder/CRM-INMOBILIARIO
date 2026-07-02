import { redirect } from "next/navigation";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Building2 } from "lucide-react";
import { actualizarEmpresa } from "./actions";

export default async function EmpresaPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");
  if (!esGestor(usuario.rol)) redirect("/inmobiliaria");

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre, email, telefono, direccion, web, logo_url")
    .eq("id", usuario.tenant_id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Building2 className="size-6 text-primary" />
        <h1 className="text-2xl font-semibold">Empresa</h1>
      </div>

      <form action={actualizarEmpresa} className="space-y-5 rounded-xl border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Nombre de la empresa</label>
            <input
              name="nombre"
              defaultValue={tenant?.nombre ?? ""}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email de contacto</label>
            <input
              name="email"
              type="email"
              defaultValue={tenant?.email ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Teléfono</label>
            <input
              name="telefono"
              type="tel"
              defaultValue={tenant?.telefono ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Dirección</label>
            <input
              name="direccion"
              defaultValue={tenant?.direccion ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Web</label>
            <input
              name="web"
              type="url"
              defaultValue={tenant?.web ?? ""}
              placeholder="https://miinmobiliaria.es"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
