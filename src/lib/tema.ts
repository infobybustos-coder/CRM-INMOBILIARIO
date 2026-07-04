export type Tema = "claro" | "oscuro";

const CLAVE = "tema-inmobiliaria";

export function aplicarTema(tema: Tema) {
  document.documentElement.querySelector(".tema-inmobiliaria")?.setAttribute("data-tema", tema);
}

export function temaInicial(): Tema {
  if (typeof window === "undefined") return "claro";
  const guardado = localStorage.getItem(CLAVE) as Tema | null;
  if (guardado === "claro" || guardado === "oscuro") {
    aplicarTema(guardado);
    return guardado;
  }
  return "claro";
}

export function guardarTema(tema: Tema) {
  localStorage.setItem(CLAVE, tema);
  aplicarTema(tema);
}
