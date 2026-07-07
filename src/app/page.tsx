import { redirect } from "next/navigation";
import { getUsuarioConTenant, esSuperadmin } from "@/lib/auth";

export default async function Home() {
  if (await esSuperadmin()) {
    redirect("/superadmin");
  }

  const usuario = await getUsuarioConTenant();

  if (!usuario) {
    redirect("/login");
  }

  redirect(usuario.tenant?.tipo_plan === "inmobiliaria" ? "/inmobiliaria" : "/asesor");
}
