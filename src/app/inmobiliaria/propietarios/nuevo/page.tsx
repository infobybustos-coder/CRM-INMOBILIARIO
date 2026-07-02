import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NuevaPropietarioForm } from "./form";

export default async function NuevaCaptacionPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const gestor = esGestor(usuario.rol);

  const { data: agentes } = gestor
    ? await supabase
        .from("usuarios")
        .select("id, nombre_completo")
        .eq("tenant_id", usuario.tenant_id)
        .eq("activo", true)
        .order("nombre_completo")
    : { data: [] };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/inmobiliaria/propietarios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Captaciones
      </Link>

      <h1 className="text-2xl font-semibold">Nueva captación</h1>

      <NuevaPropietarioForm agentes={gestor ? (agentes ?? []) : []} />
    </div>
  );
}
