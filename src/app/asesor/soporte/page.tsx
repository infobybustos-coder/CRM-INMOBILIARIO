import { redirect } from "next/navigation";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SoporteChat } from "@/components/asesor/soporte-chat";

export default async function SoportePage() {
  const usuario = await getUsuarioConTenant();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data: mensajes } = await supabase
    .from("mensajes_soporte")
    .select("id, remitente, contenido, creado_en")
    .eq("usuario_id", usuario.id)
    .order("creado_en", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Soporte técnico</h1>
      <SoporteChat mensajes={mensajes ?? []} />
    </div>
  );
}
