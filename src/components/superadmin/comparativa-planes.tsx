import { Check, Minus } from "lucide-react";
import type { ConfigPlanes } from "@/lib/planes";

function Celda({ valor }: { valor: string | boolean }) {
  if (typeof valor === "boolean") {
    return valor ? (
      <Check className="mx-auto size-4 text-emerald-600" />
    ) : (
      <Minus className="mx-auto size-4 text-muted-foreground/40" />
    );
  }
  return <span>{valor}</span>;
}

export function ComparativaPlanes({ config }: { config: ConfigPlanes }) {
  const filas: {
    label: string;
    asesorFree: string | boolean;
    asesorPro: string | boolean;
    inmobiliariaFree: string | boolean;
    inmobiliariaPro: string | boolean;
  }[] = [
    {
      label: "Propietarios",
      asesorFree: String(config.asesorFree.propietarios),
      asesorPro: "Ilimitado",
      inmobiliariaFree: String(config.inmobiliariaFree.propietarios),
      inmobiliariaPro: "Ilimitado",
    },
    {
      label: "Inmuebles",
      asesorFree: String(config.asesorFree.inmuebles),
      asesorPro: "Ilimitado",
      inmobiliariaFree: String(config.inmobiliariaFree.inmuebles),
      inmobiliariaPro: "Ilimitado",
    },
    {
      label: "Compradores",
      asesorFree: String(config.asesorFree.compradores),
      asesorPro: "Ilimitado",
      inmobiliariaFree: String(config.inmobiliariaFree.compradores),
      inmobiliariaPro: "Ilimitado",
    },
    {
      label: "Administradores",
      asesorFree: "—",
      asesorPro: "—",
      inmobiliariaFree: String(config.inmobiliariaFree.administradores),
      inmobiliariaPro: `${config.inmobiliariaProAdminsIncluidos} incluidos (ampliable)`,
    },
    {
      label: "Asesores del equipo",
      asesorFree: "—",
      asesorPro: "—",
      inmobiliariaFree: String(config.inmobiliariaFree.asesores),
      inmobiliariaPro: `${config.inmobiliariaProAsesoresIncluidos} incluidos (ampliable)`,
    },
    {
      label: "Centro de ayuda / Soporte",
      asesorFree: true,
      asesorPro: true,
      inmobiliariaFree: true,
      inmobiliariaPro: true,
    },
    {
      label: "Mensajes internos del equipo",
      asesorFree: false,
      asesorPro: false,
      inmobiliariaFree: false,
      inmobiliariaPro: true,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Incluye</th>
            <th className="px-3 py-2 text-center font-medium">Asesor Gratis</th>
            <th className="px-3 py-2 text-center font-medium">Asesor PRO</th>
            <th className="px-3 py-2 text-center font-medium">Inmobiliaria Gratis</th>
            <th className="px-3 py-2 text-center font-medium">Inmobiliaria PRO</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filas.map((f) => (
            <tr key={f.label}>
              <td className="px-3 py-2 font-medium">{f.label}</td>
              <td className="px-3 py-2 text-center text-muted-foreground">
                <Celda valor={f.asesorFree} />
              </td>
              <td className="px-3 py-2 text-center text-muted-foreground">
                <Celda valor={f.asesorPro} />
              </td>
              <td className="px-3 py-2 text-center text-muted-foreground">
                <Celda valor={f.inmobiliariaFree} />
              </td>
              <td className="px-3 py-2 text-center text-muted-foreground">
                <Celda valor={f.inmobiliariaPro} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
