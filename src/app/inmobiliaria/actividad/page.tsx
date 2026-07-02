import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Activity } from "lucide-react";

const TIPO_LABEL: Record<string, string> = {
  nota: "añadió una nota",
  llamada: "registró una llamada",
  cambio_estado: "cambió el estado",
  tarea: "creó una tarea",
  visita: "programó una visita",
  documento: "subió un documento",
  oferta: "registró una oferta",
  venta: "registró una venta",
};

const ENTIDAD_LABEL: Record<string, string> = {
  propietario: "captación",
  inmueble: "inmueble",
  comprador: "comprador",
};

const ENTIDAD_HREF: Record<string, string> = {
  propietario: "/inmobiliaria/propietarios",
  inmueble: "/inmobiliaria/inmuebles",
  comprador: "/inmobiliaria/compradores",
};

const TIPO_COLOR: Record<string, string> = {
  cambio_estado: "bg-blue-500",
  venta: "bg-emerald-500",
  oferta: "bg-violet-500",
  nota: "bg-amber-400",
  llamada: "bg-sky-500",
  visita: "bg-orange-400",
  documento: "bg-slate-400",
  tarea: "bg-rose-400",
};

export default async function ActividadPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();

  const [{ data: actividades }, { data: usuarios }] = await Promise.all([
    supabase
      .from("actividades")
      .select("id, tipo, contenido, entidad_tipo, entidad_id, usuario_id, creado_en")
      .eq("tenant_id", usuario.tenant_id)
      .order("creado_en", { ascending: false })
      .limit(100),
    supabase
      .from("usuarios")
      .select("id, nombre_completo")
      .eq("tenant_id", usuario.tenant_id),
  ]);

  const usuariosMap = Object.fromEntries(
    (usuarios ?? []).map((u) => [u.id, u.nombre_completo])
  );

  // Group by date
  const grupos: Record<string, typeof actividades> = {};
  for (const act of actividades ?? []) {
    const fecha = new Date(act.creado_en);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

    let key: string;
    if (fecha.toDateString() === hoy.toDateString()) {
      key = "Hoy";
    } else if (fecha.toDateString() === ayer.toDateString()) {
      key = "Ayer";
    } else {
      key = fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
      key = key.charAt(0).toUpperCase() + key.slice(1);
    }

    if (!grupos[key]) grupos[key] = [];
    grupos[key]!.push(act);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Actividad del equipo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Línea temporal de todo lo que ocurre en la inmobiliaria
        </p>
      </div>

      {Object.keys(grupos).length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Activity className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">Sin actividad aún</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada acción del equipo quedará registrada aquí.
          </p>
        </div>
      )}

      {Object.entries(grupos).map(([fecha, actos]) => (
        <section key={fecha}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {fecha}
          </h2>
          <div className="relative space-y-0 border-l-2 border-muted ml-2">
            {actos!.map((act) => {
              const hora = new Date(act.creado_en).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const nombre = usuariosMap[act.usuario_id] ?? "Sistema";
              const entidad = act.entidad_tipo ? ENTIDAD_LABEL[act.entidad_tipo] ?? act.entidad_tipo : null;
              const href =
                act.entidad_tipo && act.entidad_id && ENTIDAD_HREF[act.entidad_tipo]
                  ? `${ENTIDAD_HREF[act.entidad_tipo]}/${act.entidad_id}`
                  : null;
              const dot = TIPO_COLOR[act.tipo] ?? "bg-muted-foreground";

              return (
                <div key={act.id} className="relative flex gap-4 pb-4 pl-5">
                  {/* Dot */}
                  <span
                    className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-2 ring-background ${dot}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{nombre}</span>{" "}
                      <span className="text-muted-foreground">
                        {TIPO_LABEL[act.tipo] ?? act.tipo}
                        {entidad ? ` en ${entidad}` : ""}
                      </span>
                    </p>
                    {act.contenido && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {act.contenido}
                      </p>
                    )}
                    {href && (
                      <Link href={href} className="mt-0.5 inline-block text-xs text-primary hover:underline">
                        Ver ficha →
                      </Link>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{hora}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
