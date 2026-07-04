import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, UserCog, Link2 } from "lucide-react";
import { requireAdminInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ResultadoForm } from "@/components/inmobiliaria/agenda/resultado-form";
import { actualizarResultado } from "../actions";
import { ETIQUETA_TIPO_EVENTO, EMOJI_TIPO_EVENTO } from "../constantes";

const RUTA_ENTIDAD: Record<string, string> = {
  propietario: "/inmobiliaria/propietarios",
  comprador: "/inmobiliaria/compradores",
  inmueble: "/inmobiliaria/inmuebles",
};

export default async function EventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await requireAdminInmobiliaria();
  const { id } = await params;
  const supabase = await createClient();

  const { data: evento } = await supabase
    .from("eventos_agenda")
    .select(
      "id, tipo, fecha_hora, estado, usuario_id, entidad_tipo, entidad_id, inmueble_id, comprador_id, nota_resultado, descripcion"
    )
    .eq("id", id)
    .eq("tenant_id", usuario.tenant_id)
    .single();

  if (!evento) notFound();

  const [{ data: asesor }, { data: propietario }, { data: comprador }, { data: inmueble }] =
    await Promise.all([
      evento.usuario_id
        ? supabase.from("usuarios").select("nombre_completo").eq("id", evento.usuario_id).single()
        : Promise.resolve({ data: null }),
      evento.entidad_tipo === "propietario"
        ? supabase.from("propietarios").select("id, nombre").eq("id", evento.entidad_id).single()
        : Promise.resolve({ data: null }),
      evento.comprador_id || evento.entidad_tipo === "comprador"
        ? supabase
            .from("compradores")
            .select("id, nombre")
            .eq("id", evento.comprador_id ?? evento.entidad_id)
            .single()
        : Promise.resolve({ data: null }),
      evento.inmueble_id || evento.entidad_tipo === "inmueble"
        ? supabase
            .from("inmuebles")
            .select("id, direccion")
            .eq("id", evento.inmueble_id ?? evento.entidad_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

  const relacionados: { etiqueta: string; href: string }[] = [];
  if (propietario) relacionados.push({ etiqueta: propietario.nombre, href: `${RUTA_ENTIDAD.propietario}/${propietario.id}` });
  if (comprador) relacionados.push({ etiqueta: comprador.nombre, href: `${RUTA_ENTIDAD.comprador}/${comprador.id}` });
  if (inmueble) relacionados.push({ etiqueta: inmueble.direccion, href: `${RUTA_ENTIDAD.inmueble}/${inmueble.id}` });

  const fechaHora = new Date(evento.fecha_hora);

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/inmobiliaria/agenda"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a la agenda
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <span>{EMOJI_TIPO_EVENTO[evento.tipo] ?? "📌"}</span>
          {ETIQUETA_TIPO_EVENTO[evento.tipo] ?? evento.tipo}
        </h1>
      </div>

      <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          {fechaHora.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-muted-foreground" />
          {fechaHora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <UserCog className="size-4 text-muted-foreground" />
          {asesor?.nombre_completo ?? "Sin asignar"}
        </div>
        {relacionados.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm sm:col-span-2">
            <Link2 className="size-4 text-muted-foreground" />
            {relacionados.map((r) => (
              <Link key={r.href} href={r.href} className="text-primary hover:underline">
                {r.etiqueta}
              </Link>
            ))}
          </div>
        )}
      </div>

      <ResultadoForm
        notaResultado={evento.nota_resultado}
        descripcion={evento.descripcion}
        actualizarResultadoAction={actualizarResultado.bind(null, id)}
      />
    </div>
  );
}
