import { UserCheck, ShieldCheck, Users, MailQuestion } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabla } from "@/components/inmobiliaria/usuarios/tabla";
import { NuevoMiembro } from "@/components/inmobiliaria/equipo/nuevo-miembro";
import type { UsuarioFila } from "./constantes";

export default async function UsuariosPage() {
  const usuario = await requireAdminInmobiliaria();
  const supabase = await createClient();

  const [{ data: usuarios, error }, { count: invitacionesPendientes }] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id, nombre_completo, email, rol, activo, ultimo_acceso")
      .eq("tenant_id", usuario.tenant_id)
      .order("nombre_completo"),
    supabase
      .from("invitaciones")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .is("usado_en", null)
      .gt("expira_en", new Date().toISOString()),
  ]);

  const filas: UsuarioFila[] = (usuarios ?? []).map((u) => ({
    id: u.id,
    nombreCompleto: u.nombre_completo,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
    ultimoAcceso: u.ultimo_acceso,
  }));

  const activos = (usuarios ?? []).filter((u) => u.activo);

  const kpis = [
    {
      label: "Usuarios activos",
      valor: activos.length,
      icono: UserCheck,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Administradores",
      valor: activos.filter((u) => u.rol === "admin").length,
      icono: ShieldCheck,
      color: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Asesores",
      valor: activos.filter((u) => u.rol === "empleado").length,
      icono: Users,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Invitaciones pendientes",
      valor: invitacionesPendientes ?? 0,
      icono: MailQuestion,
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <NuevoMiembro etiqueta="usuario" />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-600">
          <p className="font-medium">No se pudieron cargar los usuarios.</p>
          <p className="mt-1 text-xs">{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {kpis.map(({ label, valor, icono: Icono, color }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border p-3">
            <span className={`flex size-8 items-center justify-center rounded-lg ${color}`}>
              <Icono className="size-4" />
            </span>
            <span className="text-xl font-semibold">{valor}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <Tabla usuarios={filas} usuarioActualId={usuario.id} />
    </div>
  );
}
