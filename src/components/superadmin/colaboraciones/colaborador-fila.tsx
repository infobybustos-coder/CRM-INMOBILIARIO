"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function FilaColaboradorClickable({
  colaboradorId,
  children,
}: {
  colaboradorId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/superadmin/colaboraciones/${colaboradorId}`)}
      className={cn("cursor-pointer hover:bg-accent/50")}
    >
      {children}
    </tr>
  );
}
