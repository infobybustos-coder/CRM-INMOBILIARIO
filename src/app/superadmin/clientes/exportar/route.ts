import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { nombrePais } from "@/lib/paises";

function celda(valor: string | number | null | undefined) {
  const texto = String(valor ?? "");
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export async function GET(request: Request) {
  await requireSuperadmin();

  const { searchParams } = new URL(request.url);
  const admin = createAdminClient();

  let query = admin
    .from("tenants")
    .select("id, nombre, tipo_plan, plan_tarifa, pais, estado, creado_en")
    .eq("es_demo", false)
    .order("creado_en", { ascending: false });

  const plan = searchParams.get("plan");
  const tipo = searchParams.get("tipo");
  const pais = searchParams.get("pais");
  if (plan === "gratis" || plan === "pago") query = query.eq("plan_tarifa", plan);
  if (tipo === "asesor" || tipo === "inmobiliaria") query = query.eq("tipo_plan", tipo);
  if (pais) query = query.eq("pais", pais);

  const { data: tenants } = await query;

  const { data: usuarios } = await admin
    .from("usuarios")
    .select("tenant_id, nombre_completo, email, telefono, rol")
    .in("tenant_id", (tenants ?? []).map((t) => t.id));

  const contactoPorTenant = new Map<string, NonNullable<typeof usuarios>[number]>();
  for (const u of usuarios ?? []) {
    const actual = contactoPorTenant.get(u.tenant_id);
    if (!actual || u.rol === "admin") contactoPorTenant.set(u.tenant_id, u);
  }

  const cabecera = [
    "Nombre de contacto",
    "Empresa",
    "Tipo",
    "Plan",
    "País",
    "Teléfono",
    "Email",
    "Estado",
    "Fecha de registro",
  ];

  const filas = (tenants ?? []).map((t) => {
    const contacto = contactoPorTenant.get(t.id);
    return [
      celda(contacto?.nombre_completo),
      celda(t.nombre),
      celda(t.tipo_plan),
      celda(t.plan_tarifa === "pago" ? "PRO" : "Gratis"),
      celda(nombrePais(t.pais)),
      celda(contacto?.telefono),
      celda(contacto?.email),
      celda(t.estado),
      celda(new Date(t.creado_en).toLocaleDateString("es-ES")),
    ].join(",");
  });

  const csv = "﻿" + [cabecera.join(","), ...filas].join("\n");
  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${fecha}.csv"`,
    },
  });
}
