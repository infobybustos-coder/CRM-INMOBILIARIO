"use server";

import { revalidatePath } from "next/cache";
import { getUsuarioConTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function alternarTareaGeneral(tareaId: string, completada: boolean) {
  const usuario = await getUsuarioConTenant();
  if (!usuario) throw new Error("No autenticado");

  const supabase = await createClient();
  await supabase
    .from("tareas")
    .update({
      estado: completada ? "completada" : "pendiente",
      completada_en: completada ? new Date().toISOString() : null,
    })
    .eq("id", tareaId)
    .eq("asignado_a", usuario.id);

  revalidatePath("/asesor/tareas");
  revalidatePath("/asesor");
  revalidatePath("/asesor/agenda");
}
