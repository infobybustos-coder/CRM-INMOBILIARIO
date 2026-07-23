import { requireColaborador } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarReferidosDeColaborador, obtenerEstadisticasColaborador } from "@/lib/colaboraciones/db";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { CopiarEnlace } from "@/components/inmobiliaria/equipo/copiar-enlace";
import { BotonCopiar } from "@/components/ui/boton-copiar";

const ETIQUETA_ESTADO_TENANT: Record<string, { texto: string; clase: string }> = {
  activo: { texto: "Activo", clase: "bg-emerald-500/10 text-emerald-600" },
  suspendido: { texto: "Suspendido", clase: "bg-amber-500/10 text-amber-600" },
  cancelado: { texto: "Cancelado", clase: "bg-muted text-muted-foreground" },
};

function fecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function etiquetaPlan(tipoPlan: string, planTarifa: string) {
  const tipo = tipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor";
  return `${tipo} ${planTarifa === "pago" ? "PRO" : "Gratis"}`;
}

function inicioMesIso() {
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  return inicio.toISOString();
}

export default async function ColaboradorPanelPage() {
  const colaborador = await requireColaborador();
  const admin = createAdminClient();

  const [stats, referidos, url] = await Promise.all([
    obtenerEstadisticasColaborador(admin, colaborador.id),
    listarReferidosDeColaborador(admin, colaborador.id),
    siteUrl(),
  ]);

  const enlace = `${url}/signup?ref=${colaborador.codigo_referido}`;

  const kpis = [
    { label: "Registros totales", valor: stats.totalRegistros },
    { label: "Registros este mes", valor: referidos.filter((r) => r.creadoEn >= inicioMesIso()).length },
    { label: "Usuarios activos", valor: stats.usuariosActivos },
    { label: "Asesores Free", valor: stats.asesorFree },
    { label: "Asesores PRO", valor: stats.asesorPro },
    { label: "Inmobiliarias Free", valor: stats.inmobiliariaFree },
    { label: "Inmobiliarias PRO", valor: stats.inmobiliariaPro },
    { label: "Conversión Free → Pro", valor: `${stats.conversionProPct}%` },
    { label: "Último registro", valor: fecha(stats.ultimoRegistro) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {colaborador.nombre_completo.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Aquí tienes tus estadísticas de colaboración con Ambraio.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{k.valor}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Tu código de referido</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border bg-muted/30 px-3 py-1.5 font-mono text-sm font-semibold">
            {colaborador.codigo_referido}
          </span>
          <BotonCopiar valor={colaborador.codigo_referido} etiqueta="Copiar código" />
        </div>
        <p className="pt-2 text-xs text-muted-foreground">Tu enlace personalizado</p>
        <CopiarEnlace link={enlace} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Tus referidos</h2>
        {referidos.length === 0 ? (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">
            Todavía no has conseguido ningún registro. Comparte tu código o tu enlace para empezar.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Tipo de cuenta</th>
                  <th className="px-3 py-2 font-medium">Plan actual</th>
                  <th className="px-3 py-2 font-medium">Fecha de registro</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {referidos.map((r) => {
                  const estado = ETIQUETA_ESTADO_TENANT[r.estado] ?? ETIQUETA_ESTADO_TENANT.activo;
                  return (
                    <tr key={r.tenantId}>
                      <td className="px-3 py-2 font-medium">{r.nombre}</td>
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
