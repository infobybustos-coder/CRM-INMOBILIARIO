import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import { AccionesPedido } from "@/components/superadmin/acciones-pedido";

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  iniciado: { texto: "Pendiente", clase: "bg-amber-500/10 text-amber-600" },
  pagado: { texto: "Pagado", clase: "bg-emerald-500/10 text-emerald-600" },
  cancelado: { texto: "Cancelado", clase: "bg-muted text-muted-foreground" },
};

function euros(n: number) {
  return `${n.toFixed(2).replace(".", ",")}€`;
}

export default async function PedidosPage() {
  const admin = createAdminClient();

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data: pedidos } = await admin
    .from("pedidos")
    .select("id, concepto, importe, metodo_pago, estado, creado_en, tenant_id, tenants(nombre)")
    .order("creado_en", { ascending: false })
    .limit(200);

  const filas = pedidos ?? [];

  const pendientes = filas.filter((p) => p.estado === "iniciado");
  const pagadosMes = filas.filter((p) => p.estado === "pagado" && p.creado_en >= inicioMes);
  const cancelados = filas.filter((p) => p.estado === "cancelado");
  const cancelacionesMes = cancelados.filter((p) => p.creado_en >= inicioMes);
  const importePagadoMes = pagadosMes.reduce((suma, p) => suma + Number(p.importe), 0);

  const decididosMes = pagadosMes.length + cancelacionesMes.length;
  const tasaConversion = decididosMes > 0 ? (pagadosMes.length / decididosMes) * 100 : null;

  const kpis = [
    { label: "Pedidos pendientes", valor: pendientes.length },
    { label: "Pagados este mes", valor: pagadosMes.length },
    { label: "Importe pagado este mes", valor: euros(importePagadoMes) },
    { label: "Cancelados este mes", valor: cancelacionesMes.length },
    {
      label: "Tasa de conversión",
      valor: tasaConversion === null ? "—" : `${tasaConversion.toFixed(0)}%`,
      nota: "pagados / (pagados + cancelados) este mes",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Cada intento de pago real, desde que el cliente lo solicita hasta que se confirma o se
          cancela. El MRR de Finanzas solo cuenta lo que aquí aparece como &quot;Pagado&quot;.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{k.valor}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            {"nota" in k && k.nota && <p className="mt-1 text-[10px] text-muted-foreground/70">{k.nota}</p>}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 font-medium">Importe</th>
              <th className="px-3 py-2 font-medium">Método de pago</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Todavía no hay pedidos.
                </td>
              </tr>
            ) : (
              filas.map((p) => {
                const estado = ETIQUETA_ESTADO[p.estado] ?? ETIQUETA_ESTADO.iniciado;
                const tenant = p.tenants as unknown as { nombre: string } | null;
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/superadmin/clientes/${p.tenant_id}`} className="text-primary hover:underline">
                        {tenant?.nombre ?? "—"}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{p.concepto}</td>
                    <td className="px-3 py-2">{euros(Number(p.importe))}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.metodo_pago}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", estado.clase)}>
                        {estado.texto}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(p.creado_en).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <AccionesPedido pedidoId={p.id} estado={p.estado} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
