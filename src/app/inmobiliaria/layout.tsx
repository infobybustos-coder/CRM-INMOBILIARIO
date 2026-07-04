import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";
import { InmobiliariaNav } from "@/components/inmobiliaria/nav";
import { ThemeToggle } from "@/components/inmobiliaria/theme-toggle";
import { UserMenu } from "@/components/inmobiliaria/user-menu";

export default async function InmobiliariaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();

  if (!usuario) redirect("/login");
  if (usuario.tenant?.tipo_plan !== "inmobiliaria") redirect("/asesor");

  const esAdmin = usuario.rol === "admin";

  let hayTareasHoy = false;
  if (esAdmin) {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const supabase = await createClient();
    const { count } = await supabase
      .from("tareas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .in("estado", ["pendiente", "en_progreso"])
      .gte("fecha_vencimiento", inicioHoy.toISOString())
      .lte("fecha_vencimiento", finHoy.toISOString());

    hayTareasHoy = (count ?? 0) > 0;
  }

  return (
    <div className="tema-inmobiliaria min-h-screen bg-background text-foreground md:pl-(--nav-ancho)">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">{usuario.tenant?.nombre}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu
            nombre={usuario.nombre_completo ?? usuario.email}
            rolLabel={esAdmin ? "Administrador/a" : "Empleado/a"}
            cerrarSesionAction={signOut}
          />
        </div>
      </header>
      <main className="p-4 pb-24 md:pb-6">{children}</main>
      <InmobiliariaNav esAdmin={esAdmin} avisos={hayTareasHoy ? { "/inmobiliaria/tareas": true } : {}} />
    </div>
  );
}
