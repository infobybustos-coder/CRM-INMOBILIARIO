type SerieLinea = {
  nombre: string;
  color: string;
  valores: number[];
};

export function GraficoLineas({
  etiquetas,
  series,
  alto = 140,
  grosorLinea = 2,
}: {
  etiquetas: string[];
  series: SerieLinea[];
  alto?: number;
  grosorLinea?: number;
}) {
  const ancho = 320;
  const padding = 8;
  const maxValor = Math.max(1, ...series.flatMap((s) => s.valores));
  const pasoX = etiquetas.length > 1 ? (ancho - padding * 2) / (etiquetas.length - 1) : 0;

  function puntos(valores: number[]) {
    return valores
      .map((v, i) => {
        const x = padding + i * pasoX;
        const y = alto - padding - (v / maxValor) * (alto - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={padding}
            x2={ancho - padding}
            y1={alto - padding - frac * (alto - padding * 2)}
            y2={alto - padding - frac * (alto - padding * 2)}
            stroke="currentColor"
            strokeOpacity={0.08}
          />
        ))}
        {series.map((s) => (
          <polyline
            key={s.nombre}
            points={puntos(s.valores)}
            fill="none"
            stroke={s.color}
            strokeWidth={grosorLinea}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.map((s) =>
          s.valores.map((v, i) => {
            const x = padding + i * pasoX;
            const y = alto - padding - (v / maxValor) * (alto - padding * 2);
            return <circle key={`${s.nombre}-${i}`} cx={x} cy={y} r={1.5} fill={s.color} />;
          })
        )}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        {series.map((s) => (
          <span key={s.nombre} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.nombre}
          </span>
        ))}
      </div>
    </div>
  );
}
