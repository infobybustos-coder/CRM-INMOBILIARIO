import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { estadisticasGlobalesColaboraciones, listarColaboradoresConStats } from "@/lib/colaboraciones/db";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { BotonCopiar } from "@/components/ui/boton-copiar";
import { FilaColaboradorClickable } from "@/components/superadmin/colaboraciones/colaborador-fila";
import { CeldaSinNavegar } from "@/components/superadmin/clientes-fila";

function fecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ColaboracionesPage() {
  const admin = createAdminClient();
  const url = await siteUrl();

  const [globales, colaboradores] = await Promise.all([
    estadisticasGlobalesColaboraciones(admin),
    listarColaboradoresConStats(admin),
  ]);

  const kpis = [
    { label: "Colaboradores", valor: globales.totalColaboradores },
    { label: "Registros totales", valor: globales.totalRegistros },
    { label: "Registros este mes", valor: globales.registrosEsteMes },
    { label: "Usuarios activos", valor: globales.usuariosActivos },
    { label: "Asesores Free", valor: globales.asesorFree },
    { label: "Asesores PRO", valor: globales.asesorPro },
    { label: "Inmobiliarias Free", valor: globales.inmobiliariaFree },
    { label: "Inmobiliarias PRO", valor: globales.inmobiliariaPro },
    { label: "Conversión Free → Pro", valor: `${globales.conversionProPct}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">🤝 Colaboraciones</h1>
          <p className="text-sm text-muted-foreground">
            Personas que recomiendan Ambraio: sus registros conseguidos y su conversión a PRO.
          </p>
        </div>
        <Link
          href="/superadmin/colaboraciones/nuevo"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Crear colaborador
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{k.valor}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Enlace</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Alta</th>
              <th className="px-3 py-2 font-medium">Registros</th>
              <th className="px-3 py-2 font-medium">Asesor Free</th>
              <th className="px-3 py-2 font-medium">Asesor PRO</th>
              <th className="px-3 py-2 font-medium">Inmob. Free</th>
              <th className="px-3 py-2 font-medium">Inmob. PRO</th>
              <th className="px-3 py-2 font-medium">Conversión</th>
              <th className="px-3 py-2 font-medium">Último registro</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {colaboradores.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-muted-foreground">
                  Todavía no hay colaboradores.
                </td>
              </tr>
            ) : (
              colaboradores.map((c) => (
                <FilaColaboradorClickable key={c.id} colaboradorId={c.id}>
                  <td className="px-3 py-2 font-medium text-primary">{c.nombreCompleto}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.email}</td>
                  <td className="px-3 py-2">
                    <CeldaSinNavegar>
                      <BotonCopiar valor={c.codigoReferido} etiqueta={c.codigoReferido} />
                    </CeldaSinNavegar>
                  </td>
                  <td className="px-3 py-2">
                    <CeldaSinNavegar>
                      <BotonCopiar valor={`${url}/signup?ref=${c.codigoReferido}`} etiqueta="Copiar" />
                    </CeldaSinNavegar>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        c.estado === "activo"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{fecha(c.creadoEn)}</td>
                  <td className="px-3 py-2 font-medium">{c.totalRegistros}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.asesorFree}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.asesorPro}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.inmobiliariaFree}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.inmobiliariaPro}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.conversionProPct}%</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{fecha(c.ultimoRegistro)}</td>
                </FilaColaboradorClickable>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
