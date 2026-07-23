import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FormularioMiembro } from "@/components/inmobiliaria/usuarios/formulario-miembro";

export default async function UsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await requireAdminInmobiliaria();
  const { id } = await params;
  const supabase = await createClient();

  const { data: miembro } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email, telefono, rol, activo, creado_en")
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  if (!miembro) notFound();

  return (
    <div className="max-w-lg space-y-5">
      <Link
        href="/inmobiliaria/usuarios"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a usuarios
      </Link>

      <h1 className="text-2xl font-semibold">{miembro.nombre_completo}</h1>

      <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="size-4 text-muted-foreground" /> {miembro.email}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="size-4 text-muted-foreground" /> {miembro.telefono ?? "Sin teléfono"}
        </div>
        <div className="flex items-center gap-2 text-sm sm:col-span-2">
          <Calendar className="size-4 text-muted-foreground" />
          Incorporación:{" "}
          {new Date(miembro.creado_en).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      <FormularioMiembro
        id={miembro.id}
        rol={miembro.rol}
        activo={miembro.activo}
        esUsuarioActual={miembro.id === usuario.id}
      />
    </div>
  );
}
