import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NuevoInmuebleForm } from "./form";

export default async function NuevoInmueblePage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const gestor = esGestor(usuario.rol);

  const [{ data: zonas }, { data: propietarios }] = await Promise.all([
    supabase
      .from("zonas")
      .select("id, nombre, ciudad")
      .eq("tenant_id", usuario.tenant_id)
      .order("nombre"),
    supabase
      .from("propietarios")
      .select("id, nombre")
      .eq(gestor ? "tenant_id" : "agente_id", gestor ? usuario.tenant_id : usuario.id)
      .order("nombre"),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/inmobiliaria/inmuebles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Inmuebles
      </Link>

      <h1 className="text-2xl font-semibold">Nuevo inmueble</h1>

      <NuevoInmuebleForm zonas={zonas ?? []} propietarios={propietarios ?? []} />
    </div>
  );
}
