type EventoHistorial = {
  id: string;
  contenido: string | null;
  creado_en: string;
};

export function Historial({ eventos }: { eventos: EventoHistorial[] }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">Historial</h2>

      {eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin cambios registrados todavía.</p>
      ) : (
        <div className="space-y-0 border-t pt-3">
          {eventos.map((e, i) => (
            <div key={e.id} className="relative flex gap-3 pb-3 text-sm last:pb-0">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                {i < eventos.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden />}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p>{e.contenido}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.creado_en).toLocaleString("es-ES")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
