export const PAISES = [{ codigo: "ES", nombre: "España", prefijo: "+34" }] as const;

export type CodigoPais = (typeof PAISES)[number]["codigo"];

export function prefijoPais(codigo: string) {
  return PAISES.find((p) => p.codigo === codigo)?.prefijo ?? "+34";
}
