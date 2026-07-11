import {
  UserPlus,
  Award,
  Home,
  Users,
  Phone,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";

const KPIS = [
  { icono: UserPlus, valor: "12", label: "Propietarios nuevos", color: "text-violet-600 bg-violet-50" },
  { icono: Award, valor: "8", label: "Exclusivas", color: "text-purple-600 bg-purple-50" },
  { icono: Home, valor: "34", label: "Inmuebles activos", color: "text-sky-600 bg-sky-50" },
  { icono: Users, valor: "21", label: "Compradores activos", color: "text-indigo-600 bg-indigo-50" },
  { icono: Phone, valor: "3", label: "Seguimientos pendientes", color: "text-orange-600 bg-orange-50" },
  { icono: CalendarClock, valor: "5", label: "Visitas de hoy", color: "text-rose-600 bg-rose-50" },
];

const CHECKS = [
  "Seguimientos al día",
  "Buen ritmo de captación",
  "Buen ratio de respuesta",
  "Compradores con seguimiento",
];

function MarcoNavegador({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-white text-neutral-900 shadow-xl shadow-black/10">
      <div className="flex items-center gap-2 border-b bg-neutral-50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="size-2.5 rounded-full bg-neutral-300" />
        <span className="ml-2 truncate rounded-md bg-white px-3 py-1 text-[11px] text-neutral-400">
          {titulo}
        </span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function MockCentroControl() {
  return (
    <MarcoNavegador titulo="tuinmobiliaria.crminmobiliario.com/centro-de-control">
      <p className="text-[11px] font-medium text-neutral-400">Centro de Control</p>
      <p className="mt-0.5 text-sm font-semibold">Buenas tardes, Marta</p>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-lg border p-2">
            <div className={`mb-1.5 flex size-6 items-center justify-center rounded-md ${k.color}`}>
              <k.icono className="size-3.5" />
            </div>
            <p className="text-sm font-bold leading-none">{k.valor}</p>
            <p className="mt-1 text-[9px] leading-tight text-neutral-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-neutral-500">Salud Comercial</p>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
            Excelente
          </span>
        </div>
        <p className="mt-0.5 text-2xl font-bold text-emerald-600">
          92 <span className="text-xs font-medium text-neutral-400">/100</span>
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {CHECKS.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-1 text-[9px] font-medium text-emerald-700"
            >
              <CheckCircle2 className="size-2.5" /> {c}
            </span>
          ))}
        </div>
      </div>
    </MarcoNavegador>
  );
}

function MockAgenda() {
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const destacado = 11;
  const conEventos = new Set([3, 6, 11, 14, 19, 24]);

  return (
    <MarcoNavegador titulo="tuinmobiliaria.crminmobiliario.com/agenda">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-neutral-400">Agenda y Tareas</p>
        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[9px] font-medium text-neutral-500">
          Julio 2026
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[8px] font-medium text-neutral-400">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: 2 }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {dias.map((d) => (
          <div
            key={d}
            className={`flex aspect-square items-center justify-center rounded-md text-[9px] ${
              d === destacado
                ? "bg-primary font-bold text-primary-foreground"
                : "border text-neutral-500"
            }`}
          >
            <span className="relative">
              {d}
              {conEventos.has(d) && d !== destacado && (
                <span className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary/70" />
              )}
            </span>
          </div>
        ))}
      </div>
    </MarcoNavegador>
  );
}

export function ProductoPreview() {
  return (
    <section className="border-t py-16">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="font-serif text-2xl font-semibold sm:text-3xl">Así es por dentro</h2>
        <p className="mt-2 text-muted-foreground">
          Un vistazo real a tu día a día: todo tu negocio en dos pantallas.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <MockCentroControl />
          <MockAgenda />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          🎥 Muy pronto: un vídeo completo enseñando el CRM en acción.
        </p>
      </div>
    </section>
  );
}
