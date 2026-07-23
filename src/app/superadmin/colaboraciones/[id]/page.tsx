import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listarReferidosDeColaborador,
  obtenerColaborador,
  obtenerEstadisticasColaborador,
} from "@/lib/colaboraciones/db";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { CopiarEnlace } from "@/components/inmobiliaria/equipo/copiar-enlace";
import { ColaboradorEstadoBoton } from "@/components/superadmin/colaboraciones/colaborador-estado-boton";
import { EliminarColaboradorBoton } from "@/components/superadmin/colaboraciones/eliminar-colaborador-boton";

const ETIQUETA_ESTADO_TENANT: Record<string, { texto: string; clase: string }> = {
  activo: { texto: "Activo", clase: "bg-emerald-500/10 text-emerald-600" },
  suspendido: { texto: "Suspendido", clase: "bg-amber-500/10 text-amber-600" },
  cancelado: { texto: "Cancelado", clase: "bg-muted text-muted-foreground" },
};

function fecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function etiquetaPlan(tipoPlan: string, planTarifa: string) {
  const tipo = tipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor";
  return `${tipo} ${planTarifa === "pago" ? "PRO" : "Gratis"}`;
}

export default async function ColaboradorFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const colaborador = await obtenerColaborador(admin, id);
  if (!colaborador) notFound();

  const [stats, referidos, url] = await Promise.all([
    obtenerEstadisticasColaborador(admin, id),
    listarReferidosDeColaborador(admin, id),
    siteUrl(),
  ]);

  const enlace = `${url}/signup?ref=${colaborador.codigoReferido}`;

  const campos = [
    { label: "Nombre", valor: colaborador.nombreCompleto },
    { label: "Email", valor: colaborador.email },
    { label: "Código de referido", valor: colaborador.codigoReferido },
    { label: "Fecha de creación", valor: fecha(colaborador.creadoEn) },
  ];

  const kpis = [
    { label: "Registros totales", valor: stats.totalRegistros },
    { label: "Usuarios activos", valor: stats.usuariosActivos },
    { label: "Asesores Free", valor: stats.asesorFree },
    { label: "Asesores PRO", valor: stats.asesorPro },
    { label: "Inmobiliarias Free", valor: stats.inmobiliariaFree },
    { label: "Inmobiliarias PRO", valor: stats.inmobiliariaPro },
    { label: "Conversión a PRO", valor: `${stats.conversionProPct}%` },
    { label: "Último registro", valor: fecha(stats.ultimoRegistro) },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/superadmin/colaboraciones"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a Colaboraciones
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{colaborador.nombreCompleto}</h1>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            colaborador.estado === "activo"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          {colaborador.estado === "activo" ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="divide-y rounded-lg border">
        {campos.map((c) => (
          <div key={c.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="font-medium">{c.valor}</span>
          </div>
        ))}
        <div className="px-4 py-2.5 text-sm">
          <p className="mb-1.5 text-muted-foreground">Enlace personalizado</p>
          <CopiarEnlace link={enlace} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Estadísticas</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{k.valor}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Gestionar</h2>
        <div className="flex flex-wrap gap-2">
          <ColaboradorEstadoBoton id={colaborador.id} estado={colaborador.estado} />
          <EliminarColaboradorBoton colaboradorId={colaborador.id} nombreColaborador={colaborador.nombreCompleto} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Usuarios registrados con este código</h2>
        {referidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no ha conseguido ningún registro.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Tipo de cuenta</th>
                  <th className="px-3 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 font-medium">Registro</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {referidos.map((r) => {
                  const estado = ETIQUETA_ESTADO_TENANT[r.estado] ?? ETIQUETA_ESTADO_TENANT.activo;
                  return (
                    <tr key={r.tenantId}>
                      <td className="px-3 py-2 font-medium">{r.nombre}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                      <td className="px-3 py-2 text-muted-foreground capitalize">{r.tipoPlan}</td>
                      <td className="px-3 py-2 text-muted-foreground">{etiquetaPlan(r.tipoPlan, r.planTarifa)}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{fecha(r.creadoEn)}</td>
                      <td className="px-3 py-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estado.clase)}>
                          {estado.texto}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
