"use client";

import { createContext, useContext, useState } from "react";

export type Moneda = "EUR" | "USD";
export type Idioma = "es" | "en";

type Preferencias = {
  moneda: Moneda;
  idioma: Idioma;
};

const PreferenciasContext = createContext<Preferencias>({ moneda: "EUR", idioma: "es" });

export function PreferenciasProvider({
  inicial,
  children,
}: {
  inicial: Preferencias;
  children: React.ReactNode;
}) {
  const [preferencias] = useState(inicial);
  return (
    <PreferenciasContext.Provider value={preferencias}>{children}</PreferenciasContext.Provider>
  );
}

const SIMBOLO_MONEDA: Record<Moneda, string> = { EUR: "€", USD: "$" };

export function useMoneda() {
  const { moneda } = useContext(PreferenciasContext);
  const simbolo = SIMBOLO_MONEDA[moneda];

  function formatear(valor: number | string | null | undefined): string {
    if (valor === null || valor === undefined || valor === "") return "—";
    const n = Number(valor);
    const texto = n.toLocaleString(moneda === "USD" ? "en-US" : "es-ES");
    return moneda === "USD" ? `$${texto}` : `${texto} €`;
  }

  return { moneda, simbolo, formatear };
}

export function useIdioma() {
  const { idioma } = useContext(PreferenciasContext);
  return idioma;
}
