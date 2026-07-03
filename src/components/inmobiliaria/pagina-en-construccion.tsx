import { type LucideIcon } from "lucide-react";

export function PaginaEnConstruccion({
  titulo,
  descripcion,
  icono: Icono,
}: {
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <Icono className="size-8 text-muted-foreground" />
        <p className="font-medium">Próximamente</p>
        <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      </div>
    </div>
  );
}
