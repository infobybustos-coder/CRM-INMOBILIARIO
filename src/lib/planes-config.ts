import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CONFIG_PLANES_POR_DEFECTO, type ConfigPlanes } from "@/lib/planes";

export async function obtenerConfigPlanes(): Promise<ConfigPlanes> {
  const supabase = await createClient();
  const { data } = await supabase.from("config_planes").select("*").eq("id", 1).maybeSingle();
  if (!data) return CONFIG_PLANES_POR_DEFECTO;

  return {
    asesorFree: {
      propietarios: data.asesor_free_propietarios,
      inmuebles: data.asesor_free_inmuebles,
      compradores: data.asesor_free_compradores,
    },
    asesorProPrecio: Number(data.asesor_pro_precio),
    inmobiliariaFree: {
      propietarios: data.inmobiliaria_free_propietarios,
      inmuebles: data.inmobiliaria_free_inmuebles,
      compradores: data.inmobiliaria_free_compradores,
      administradores: data.inmobiliaria_free_administradores,
      asesores: data.inmobiliaria_free_asesores,
    },
    inmobiliariaProPrecio: Number(data.inmobiliaria_pro_precio),
    inmobiliariaProAdminsIncluidos: data.inmobiliaria_pro_administradores,
    inmobiliariaProAsesoresIncluidos: data.inmobiliaria_pro_asesores,
    precioAdminExtra: Number(data.inmobiliaria_pro_precio_admin_extra),
    precioAsesorExtra: Number(data.inmobiliaria_pro_precio_asesor_extra),
    asesorProStripePriceId: data.asesor_pro_stripe_price_id ?? null,
    inmobiliariaProStripePriceId: data.inmobiliaria_pro_stripe_price_id ?? null,
  };
}
