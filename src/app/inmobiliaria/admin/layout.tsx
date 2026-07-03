import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioConTenant();

  if (usuario?.rol !== "admin") redirect("/inmobiliaria");

  return <>{children}</>;
}
