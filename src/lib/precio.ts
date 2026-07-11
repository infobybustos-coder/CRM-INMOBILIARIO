export function formatearPrecio(n: number, moneda: "EUR" | "USD") {
  const simbolo = moneda === "USD" ? "$" : "€";
  return `${n.toFixed(2).replace(".", ",")}${simbolo}`;
}
