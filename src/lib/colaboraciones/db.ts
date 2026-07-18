import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarCodigoReferido } from "./codigo";
import type {
  Colaborador,
  ColaboradorConStats,
  EstadisticasColaborador,
  EstadisticasGlobales,
  EstadoColaborador,
  ReferidoDetalle,
} from "./tipos";

type AdminClient = ReturnType<typeof createAdminClient>;

type TenantResumen = {
  id: string;
  nombre: string;
  tipo_plan: string;
  plan_tarifa: string;
  estado: string;
  creado_en: string;
};

type ReferidoFila = { colaborador_id: string; tenant_id: string; creado_en: string };

function mapColaborador(fila: {
  id: string;
  nombre_completo: string;
  email: string;
  codigo_referido: string;
  estado: string;
  creado_en: string;
}): Colaborador {
  return {
    id: fila.id,
    nombreCompleto: fila.nombre_completo,
    email: fila.email,
    codigoReferido: fila.codigo_referido,
    estado: fila.estado as EstadoColaborador,
    creadoEn: fila.creado_en,
  };
}

// Toda estadística de Colaboraciones se calcula aquí, al vuelo, a partir
// del estado ACTUAL de los tenants referidos — nunca de un contador
// guardado. Así, si un referido pasa de Free a Pro, cancela, o cambia de
// tipo de plan, la próxima vez que se lea el dashboard/ficha ya sale
// actualizado, sin tener que tocar ningún otro sitio del código.
function calcularEstadisticas(
  tenants: TenantResumen[],
  ultimoRegistro: string | null
): EstadisticasColaborador {
  let asesorFree = 0;
  let asesorPro = 0;
  let inmobiliariaFree = 0;
  let inmobiliariaPro = 0;
  let usuariosActivos = 0;

  for (const t of tenants) {
    const esPro = t.plan_tarifa === "pago";
    if (t.tipo_plan === "inmobiliaria") {
      if (esPro) inmobiliariaPro += 1;
      else inmobiliariaFree += 1;
    } else {
      if (esPro) asesorPro += 1;
      else asesorFree += 1;
    }
    if (t.estado === "activo") usuariosActivos += 1;
  }

  const totalRegistros = tenants.length;
  const totalPro = asesorPro + inmobiliariaPro;

  return {
    totalRegistros,
    usuariosActivos,
    asesorFree,
    asesorPro,
    inmobiliariaFree,
    inmobiliariaPro,
    conversionProPct: totalRegistros > 0 ? Math.round((totalPro / totalRegistros) * 1000) / 10 : 0,
    ultimoRegistro,
  };
}

function ultimaFecha(fechas: string[]): string | null {
  return fechas.reduce<string | null>((max, f) => (!max || f > max ? f : max), null);
}

// Trae los tenants referidos (por id) de una sola vez, en un Map — evita
// depender de la inferencia de joins anidados de PostgREST/supabase-js,
// que aquí no tiene un esquema tipado detrás (mismo patrón que el resto
// del proyecto: consultas separadas + Map, ver clientes/page.tsx).
async function tenantsPorId(admin: AdminClient, tenantIds: string[]): Promise<Map<string, TenantResumen>> {
  const mapa = new Map<string, TenantResumen>();
  if (tenantIds.length === 0) return mapa;
  const { data } = await admin
    .from("tenants")
    .select("id, nombre, tipo_plan, plan_tarifa, estado, creado_en")
    .in("id", tenantIds);
  for (const t of data ?? []) mapa.set(t.id, t);
  return mapa;
}

export async function obtenerColaboradorPorCodigo(
  admin: AdminClient,
  codigo: string
): Promise<{ id: string } | null> {
  const { data } = await admin
    .from("colaboradores")
    .select("id")
    .eq("codigo_referido", normalizarCodigoReferido(codigo))
    .eq("estado", "activo")
    .maybeSingle();
  return data;
}

export async function codigoReferidoDisponible(admin: AdminClient, codigo: string): Promise<boolean> {
  const { count } = await admin
    .from("colaboradores")
    .select("id", { count: "exact", head: true })
    .eq("codigo_referido", normalizarCodigoReferido(codigo));
  return (count ?? 0) === 0;
}

export async function registrarReferido(
  admin: AdminClient,
  datos: { colaboradorId: string; tenantId: string; codigoUsado: string }
): Promise<void> {
  const { error } = await admin.from("colaborador_referidos").insert({
    colaborador_id: datos.colaboradorId,
    tenant_id: datos.tenantId,
    codigo_usado: normalizarCodigoReferido(datos.codigoUsado),
  });
  if (error) console.error("registrarReferido:", error);
}

export async function obtenerColaborador(admin: AdminClient, id: string): Promise<Colaborador | null> {
  const { data } = await admin.from("colaboradores").select("*").eq("id", id).maybeSingle();
  return data ? mapColaborador(data) : null;
}

export async function obtenerEstadisticasColaborador(
  admin: AdminClient,
  colaboradorId: string
): Promise<EstadisticasColaborador> {
  const { data } = await admin
    .from("colaborador_referidos")
    .select("tenant_id, creado_en")
    .eq("colaborador_id", colaboradorId);

  const filas = (data ?? []) as ReferidoFila[];
  const tenantsMap = await tenantsPorId(admin, filas.map((f) => f.tenant_id));
  const tenants = filas.map((f) => tenantsMap.get(f.tenant_id)).filter((t): t is TenantResumen => t !== undefined);

  return calcularEstadisticas(tenants, ultimaFecha(filas.map((f) => f.creado_en)));
}

export async function listarReferidosDeColaborador(
  admin: AdminClient,
  colaboradorId: string
): Promise<ReferidoDetalle[]> {
  const { data: referidos } = await admin
    .from("colaborador_referidos")
    .select("tenant_id, creado_en")
    .eq("colaborador_id", colaboradorId)
    .order("creado_en", { ascending: false });

  const filas = (referidos ?? []) as ReferidoFila[];
  const tenantIds = filas.map((f) => f.tenant_id);
  const tenantsMap = await tenantsPorId(admin, tenantIds);

  const { data: usuarios } = await admin
    .from("usuarios")
    .select("tenant_id, nombre_completo, email, rol")
    .in("tenant_id", tenantIds.length > 0 ? tenantIds : ["00000000-0000-0000-0000-000000000000"]);

  const contactoPorTenant = new Map<string, { nombre_completo: string; email: string }>();
  for (const u of usuarios ?? []) {
    const actual = contactoPorTenant.get(u.tenant_id);
    if (!actual || u.rol === "admin") contactoPorTenant.set(u.tenant_id, u);
  }

  return filas
    .map((f) => tenantsMap.get(f.tenant_id))
    .filter((tenant): tenant is TenantResumen => tenant !== undefined)
    .map((tenant) => {
      const contacto = contactoPorTenant.get(tenant.id);
      return {
        tenantId: tenant.id,
        nombre: contacto?.nombre_completo ?? tenant.nombre,
        email: contacto?.email ?? "—",
        tipoPlan: tenant.tipo_plan,
        planTarifa: tenant.plan_tarifa,
        estado: tenant.estado,
        creadoEn: tenant.creado_en,
      };
    });
}

export async function listarColaboradoresConStats(admin: AdminClient): Promise<ColaboradorConStats[]> {
  const [{ data: colaboradores }, { data: referidos }] = await Promise.all([
    admin.from("colaboradores").select("*").order("creado_en", { ascending: false }),
    admin.from("colaborador_referidos").select("colaborador_id, tenant_id, creado_en"),
  ]);

  const filas = (referidos ?? []) as ReferidoFila[];
  const tenantsMap = await tenantsPorId(admin, filas.map((f) => f.tenant_id));

  const porColaborador = new Map<string, { tenants: TenantResumen[]; fechas: string[] }>();
  for (const r of filas) {
    const tenant = tenantsMap.get(r.tenant_id);
    if (!tenant) continue;
    const actual = porColaborador.get(r.colaborador_id) ?? { tenants: [], fechas: [] };
    actual.tenants.push(tenant);
    actual.fechas.push(r.creado_en);
    porColaborador.set(r.colaborador_id, actual);
  }

  return (colaboradores ?? []).map((c) => {
    const agregado = porColaborador.get(c.id) ?? { tenants: [], fechas: [] };
    return {
      ...mapColaborador(c),
      ...calcularEstadisticas(agregado.tenants, ultimaFecha(agregado.fechas)),
    };
  });
}

export async function estadisticasGlobalesColaboraciones(admin: AdminClient): Promise<EstadisticasGlobales> {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const inicioMesIso = inicioMes.toISOString();

  const [{ count: totalColaboradores }, { data: referidos }] = await Promise.all([
    admin.from("colaboradores").select("id", { count: "exact", head: true }),
    admin.from("colaborador_referidos").select("tenant_id, creado_en"),
  ]);

  const filas = (referidos ?? []) as ReferidoFila[];
  const tenantsMap = await tenantsPorId(admin, filas.map((f) => f.tenant_id));
  const tenants = filas.map((f) => tenantsMap.get(f.tenant_id)).filter((t): t is TenantResumen => t !== undefined);
  const registrosEsteMes = filas.filter((f) => f.creado_en >= inicioMesIso).length;

  return {
    totalColaboradores: totalColaboradores ?? 0,
    registrosEsteMes,
    ...calcularEstadisticas(tenants, ultimaFecha(filas.map((f) => f.creado_en))),
  };
}
