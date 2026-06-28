import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";

export default async function Home() {
  const usuario = await getUsuarioConTenant();

  if (!usuario) {
    redirect("/login");
  }

  redirect(usuario.tenant?.tipo_plan === "inmobiliaria" ? "/inmobiliaria" : "/asesor");
}
