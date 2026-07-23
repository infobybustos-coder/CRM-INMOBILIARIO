import Link from "next/link";
import { WhatsAppBoton } from "@/components/superadmin/whatsapp-boton";
import type { ConversacionConCliente } from "@/lib/soporte/tipos";

function fecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function FichaClienteConversacion({ conversacion }: { conversacion: ConversacionConCliente }) {
  return (
    <div className="w-64 shrink-0 space-y-3 overflow-y-auto border-l p-4 text-sm">
      <h2 className="font-semibold">Cliente</h2>
      <div className="space-y-2">
        <div>
          <p className="text-[11px] text-muted-foreground">Nombre</p>
          <p className="font-medium">{conversacion.clienteNombre}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Email</p>
          <p className="truncate">{conversacion.clienteEmail}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Teléfono</p>
          <div className="flex items-center gap-1.5">
            <span>{conversacion.clienteTelefono ?? "—"}</span>
            <WhatsAppBoton telefono={conversacion.clienteTelefono} nombre={conversacion.clienteNombre} />
          </div>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Tipo de cuenta</p>
          <p className="capitalize">
            {conversacion.tenantTipoPlan === "inmobiliaria" ? "Inmobiliaria" : "Asesor"}
            {conversacion.clienteRol === "admin" ? " · admin" : conversacion.clienteRol === "empleado" ? " · empleado" : ""}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Plan</p>
          <p>{conversacion.tenantPlanTarifa === "pago" ? "PRO" : "Gratis"}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Empresa</p>
          <p>{conversacion.tenantNombre}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Fecha de registro</p>
          <p>{fecha(conversacion.tenantCreadoEn)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Último acceso</p>
          <p>{fecha(conversacion.clienteUltimoAcceso)}</p>
        </div>
      </div>
      <Link
        href={`/superadmin/clientes/${conversacion.tenantId}`}
        className="block text-xs font-medium text-primary hover:underline"
      >
        Ver ficha completa del cliente →
      </Link>
    </div>
  );
}
