"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function FilaClienteClickable({
  tenantId,
  children,
}: {
  tenantId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/superadmin/clientes/${tenantId}`)}
      className={cn("cursor-pointer hover:bg-accent/50")}
    >
      {children}
    </tr>
  );
}

// Envuelve celdas con controles propios (botones, enlaces externos) para
// que el clic no dispare también la navegación de la fila entera.
export function CeldaSinNavegar({ children }: { children: React.ReactNode }) {
  return <span onClick={(e) => e.stopPropagation()}>{children}</span>;
}
