import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, Clock } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AgentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await requireAdminInmobiliaria();
  const { id } = await params;
  const supabase = await createClient();

  const { data: agente } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email, telefono, rol, creado_en, ultimo_acceso, activo")
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  if (!agente) notFound();

  const [
    { data: propietarios },
    { data: compradores },
    { data: inmuebles },
    { count: tareasPendientes },
    { count: captaciones },
    { count: exclusivas },
    { data: actividades },
  ] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id, nombre, estado")
      .eq("tenant_id", usuario.tenant_id)
      .eq("agente_id", id)
      .not("estado", "in", "(captado,perdido)")
      .order("creado_en", { ascending: false }),
    supabase
      .from("compradores")
      .select("id, nombre, estado")
      .eq("tenant_id", usuario.tenant_id)
      .eq("agente_id", id)
      .not("estado", "in", "(comprado,perdido)")
      .order("creado_en", { ascending: false }),
    supabase
      .from("inmuebles")
      .select("id, direccion, estado")
      .eq("tenant_id", usuario.tenant_id)
      .eq("agente_id", id)
      .neq("estado", "vendido")
      .order("creado_en", { ascending: false }),
    supabase
      .from("tareas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("asignado_a", id)
      .in("estado", ["pendiente", "en_progreso"]),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("agente_id", id)
      .eq("estado", "captado"),
    supabase
      .from("propietarios")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", usuario.tenant_id)
      .eq("agente_id", id)
      .eq("estado", "exclusiva_firmada"),
    supabase
      .from("actividades")
      .select("id, contenido, tipo, creado_en")
      .eq("tenant_id", usuario.tenant_id)
      .eq("usuario_id", id)
      .order("creado_en", { ascending: false })
      .limit(8),
  ]);

  const stats = [
    { label: "Propietarios asignados", valor: propietarios?.length ?? 0 },
    { label: "Compradores asignados", valor: compradores?.length ?? 0 },
    { label: "Inmuebles asignados", valor: inmuebles?.length ?? 0 },
    { label: "Tareas pendientes", valor: tareasPendientes ?? 0 },
    { label: "Captaciones", valor: captaciones ?? 0 },
    { label: "Exclusivas", valor: exclusivas ?? 0 },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/inmobiliaria/agentes"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a agentes
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{agente.nombre_completo}</h1>
        <span
          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            agente.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
          }`}
        >
          {agente.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="size-4 text-muted-foreground" /> {agente.email}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="size-4 text-muted-foreground" /> {agente.telefono ?? "Sin teléfono"}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="size-4 text-muted-foreground" />
          Alta: {new Date(agente.creado_en).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-muted-foreground" />
          {agente.ultimo_acceso
            ? `Último acceso: ${new Date(agente.ultimo_acceso).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
            : "Sin accesos registrados"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {stats.map(({ label, valor }) => (
          <div key={label} className="flex flex-col gap-1 rounded-xl border p-3">
            <span className="text-xl font-semibold">{valor}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Propietarios asignados</h2>
          {(propietarios ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Sin propietarios activos.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {(propietarios ?? []).map((p) => (
                <li key={p.id} className="text-sm">
                  <Link href={`/inmobiliaria/propietarios/${p.id}`} className="hover:underline">
                    {p.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Compradores asignados</h2>
          {(compradores ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Sin compradores activos.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {(compradores ?? []).map((c) => (
                <li key={c.id} className="text-sm">
                  <Link href={`/inmobiliaria/compradores/${c.id}`} className="hover:underline">
                    {c.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-3">
          <h2 className="text-sm font-medium">Inmuebles asignados</h2>
          {(inmuebles ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Sin inmuebles activos.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {(inmuebles ?? []).map((i) => (
                <li key={i.id} className="text-sm">
                  <Link href={`/inmobiliaria/inmuebles/${i.id}`} className="hover:underline">
                    {i.direccion}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="font-semibold">Actividad reciente</h2>
        {(actividades ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin actividad todavía.</p>
        ) : (
          <div className="mt-3 space-y-0 border-t pt-3">
            {(actividades ?? []).map((a, i) => (
              <div key={a.id} className="relative flex gap-3 pb-3 text-sm last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  {i < (actividades?.length ?? 0) - 1 && (
                    <span className="w-px flex-1 bg-border" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <p>{a.contenido}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.creado_en).toLocaleString("es-ES")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
