import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioConTenant, esGestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const ENTIDAD_LABEL: Record<string, string> = {
  propietario: "Captación",
  inmueble: "Inmueble",
  comprador: "Comprador",
  visita: "Visita",
};

const ENTIDAD_HREF: Record<string, string> = {
  propietario: "/inmobiliaria/propietarios",
  inmueble: "/inmobiliaria/inmuebles",
  comprador: "/inmobiliaria/compradores",
};

export default async function TareasPage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const gestor = esGestor(usuario.rol);
  const supabase = await createClient();

  const { data: tareas } = await supabase
    .from("tareas")
    .select("id, titulo, descripcion, completada, fecha_vencimiento, entidad_tipo, entidad_id, creado_en")
    .eq("tenant_id", usuario.tenant_id)
    .order("completada", { ascending: true })
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false })
    .limit(100);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pendientes = (tareas ?? []).filter((t) => !t.completada);
  const completadas = (tareas ?? []).filter((t) => t.completada);
  const vencidas = pendientes.filter(
    (t) => t.fecha_vencimiento && new Date(t.fecha_vencimiento) < hoy
  );
  const hoy_tareas = pendientes.filter((t) => {
    if (!t.fecha_vencimiento) return false;
    const f = new Date(t.fecha_vencimiento);
    f.setHours(0, 0, 0, 0);
    return f.getTime() === hoy.getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tareas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas las tareas pendientes de la inmobiliaria
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <Clock className="mx-auto mb-1 size-5 text-primary" />
          <p className="text-2xl font-bold">{pendientes.length}</p>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <AlertCircle className="mx-auto mb-1 size-5 text-red-500" />
          <p className="text-2xl font-bold text-red-600">{vencidas.length}</p>
          <p className="text-xs text-muted-foreground">Vencidas</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <CheckCircle2 className="mx-auto mb-1 size-5 text-emerald-500" />
          <p className="text-2xl font-bold">{completadas.length}</p>
          <p className="text-xs text-muted-foreground">Completadas</p>
        </div>
      </div>

      {/* Overdue */}
      {vencidas.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-red-600 dark:text-red-400">
            <AlertCircle className="size-4" />
            Vencidas
          </h2>
          <TareaLista tareas={vencidas} estado="vencida" />
        </section>
      )}

      {/* Due today */}
      {hoy_tareas.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-amber-600 dark:text-amber-400">Para hoy</h2>
          <TareaLista tareas={hoy_tareas} estado="hoy" />
        </section>
      )}

      {/* Rest pending */}
      {pendientes.filter((t) => !vencidas.includes(t) && !hoy_tareas.includes(t)).length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">Próximas</h2>
          <TareaLista
            tareas={pendientes.filter((t) => !vencidas.includes(t) && !hoy_tareas.includes(t))}
            estado="pendiente"
          />
        </section>
      )}

      {pendientes.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 size-8 text-emerald-500/50" />
          <p className="font-medium">Sin tareas pendientes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Las tareas se crean desde la ficha de cada propietario, inmueble o comprador.
          </p>
        </div>
      )}
    </div>
  );
}

function TareaLista({
  tareas,
  estado,
}: {
  tareas: { id: string; titulo: string; descripcion: string | null; fecha_vencimiento: string | null; entidad_tipo: string | null; entidad_id: string | null }[];
  estado: "vencida" | "hoy" | "pendiente";
}) {
  return (
    <div className="rounded-xl border divide-y overflow-hidden">
      {tareas.map((t) => {
        const href =
          t.entidad_tipo && t.entidad_id && ENTIDAD_HREF[t.entidad_tipo]
            ? `${ENTIDAD_HREF[t.entidad_tipo]}/${t.entidad_id}`
            : null;

        return (
          <div key={t.id} className="flex items-start gap-3 px-4 py-3">
            <CheckCircle2
              className={cn(
                "mt-0.5 size-4 shrink-0",
                estado === "vencida"
                  ? "text-red-400"
                  : estado === "hoy"
                  ? "text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-snug">{t.titulo}</p>
              {t.descripcion && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.descripcion}</p>
              )}
              {t.entidad_tipo && (
                <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {ENTIDAD_LABEL[t.entidad_tipo] ?? t.entidad_tipo}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {t.fecha_vencimiento && (
                <span
                  className={cn(
                    "text-xs",
                    estado === "vencida" ? "font-medium text-red-500" : "text-muted-foreground"
                  )}
                >
                  {new Date(t.fecha_vencimiento).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
              {href && (
                <Link
                  href={href}
                  className="rounded px-2 py-0.5 text-xs text-primary hover:underline"
                >
                  Ver →
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
