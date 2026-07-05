import { requireInmobiliaria } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PerfilForm } from "@/components/asesor/perfil-form";

export default async function PerfilInmobiliariaPage() {
  const usuario = await requireInmobiliaria();

  const supabase = await createClient();
  const avatarUrl = usuario.avatar_url
    ? supabase.storage.from("avatares").getPublicUrl(usuario.avatar_url).data.publicUrl
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>
      <PerfilForm
        usuarioId={usuario.id}
        nombreCompleto={usuario.nombre_completo ?? ""}
        email={usuario.email}
        telefono={usuario.telefono}
        bio={usuario.bio}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
