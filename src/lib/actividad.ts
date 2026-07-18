"use server";

import { createClient } from "@/lib/supabase/server";

// Latido de actividad: la sesión llama a esto cada minuto mientras la
// pestaña está abierta, para que el superadmin pueda ver quién está
// conectado ahora mismo. Usa el cliente normal (no el de servicio):
// la política usuarios_update_propio ya permite a cada usuario
// actualizar su propia fila.
export async function registrarActividad() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("usuarios").update({ ultima_actividad: new Date().toISOString() }).eq("id", user.id);
}
