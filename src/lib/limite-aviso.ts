import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { limiteRecurso, type ConfigPlanes } from "@/lib/planes";
import { siteUrl } from "@/lib/site-url";
import { enviarCorreo } from "@/lib/correos/enviar";

type Recurso = "propietarios" | "inmuebles" | "compradores";

// De mayor a menor: se dispara solo el umbral más alto ya alcanzado que
// todavía no se haya avisado (si un alta salta directamente de 70% a
// 100%, se avisa una vez de "límite alcanzado" y no además de "cerca del
// límite").
const UMBRALES = [1, 0.9, 0.8] as const;

// Llamada en fire-and-forget tras un alta con éxito: nunca lanza, nunca
// bloquea la respuesta de la acción de creación que la dispara.
export async function verificarUmbralesLimite(
  usuario: {
    tenant_id: string;
    tenant?: { nombre?: string | null; tipo_plan?: string | null; plan_tarifa?: string | null } | null;
  },
  recurso: Recurso,
  config: ConfigPlanes,
  nuevoConteo: number
) {
  try {
    const limite = limiteRecurso(config, usuario.tenant ?? {}, recurso);
    if (limite === null || limite <= 0) return;

    const ratio = nuevoConteo / limite;
    const umbral = UMBRALES.find((u) => ratio >= u);
    if (!umbral) return;

    const umbralEntero = Math.round(umbral * 100);
    const admin = createAdminClient();

    // Idempotente: si ya existe una fila para este tenant/recurso/umbral,
    // ignoreDuplicates hace que no se inserte nada ni se envíe el correo
    // otra vez.
    const { data: insertado } = await admin
      .from("avisos_limite_enviados")
      .upsert(
        { tenant_id: usuario.tenant_id, recurso, umbral: umbralEntero },
        { onConflict: "tenant_id,recurso,umbral", ignoreDuplicates: true }
      )
      .select("id");
    if (!insertado || insertado.length === 0) return;

    const { data: contacto } = await admin
      .from("usuarios")
      .select("nombre_completo, email")
      .eq("tenant_id", usuario.tenant_id)
      .order("rol", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!contacto) return;

    const appUrl = await siteUrl();
    if (umbralEntero >= 100) {
      await enviarCorreo("limite_alcanzado", contacto.email, {
        nombre: contacto.nombre_completo ?? "",
        empresa: usuario.tenant?.nombre ?? "",
        recurso,
        app_url: appUrl,
      });
    } else {
      await enviarCorreo("limite_aviso", contacto.email, {
        nombre: contacto.nombre_completo ?? "",
        empresa: usuario.tenant?.nombre ?? "",
        recurso,
        porcentaje: String(umbralEntero),
        app_url: appUrl,
      });
    }
  } catch (err) {
    console.error("verificarUmbralesLimite:", err);
  }
}
