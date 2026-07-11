"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Borra todas las fotos diarias de MRR guardadas hasta ahora (p. ej. las
// del periodo de pruebas). La página vuelve a generar la foto de hoy en
// la siguiente carga, así que el histórico simplemente empieza de cero.
export async function borrarHistorialMrr() {
  const superadmin = await requireSuperadmin();
  const admin = createAdminClient();

  await admin.from("mrr_snapshots").delete().gte("fecha", "1900-01-01");

  await admin.from("superadmin_auditoria").insert({
    accion: "borrar_historial_mrr",
    detalle: "Historial de fotos diarias de MRR borrado.",
    actor_email: superadmin.email,
  });

  revalidatePath("/superadmin/finanzas");
}
