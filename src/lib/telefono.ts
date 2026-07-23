import {
  isValidPhoneNumber,
  isSupportedCountry,
  parsePhoneNumberFromString,
  AsYouType,
  type CountryCode,
} from "libphonenumber-js";
import { prefijoPais } from "@/lib/paises";

function comoCountryCode(pais: string): CountryCode | undefined {
  return isSupportedCountry(pais) ? (pais as CountryCode) : undefined;
}

export function telefonoValido(pais: string, numero: string) {
  const country = comoCountryCode(pais);
  if (!country || !numero.trim()) return false;
  try {
    return isValidPhoneNumber(numero, country);
  } catch {
    return false;
  }
}

export function formatearMientrasEscribe(pais: string, numero: string) {
  const country = comoCountryCode(pais);
  if (!country) return numero;
  return new AsYouType(country).input(numero);
}

export function normalizarTelefono(pais: string, numero: string) {
  const country = comoCountryCode(pais);
  if (country) {
    const parsed = parsePhoneNumberFromString(numero, country);
    if (parsed) return parsed.number;
  }
  const digitos = numero.replace(/\D/g, "");
  return `${prefijoPais(pais)}${digitos}`;
}

export function emailSinteticoDesdeIdentificador(identificador: string) {
  const digitos = identificador.replace(/\D/g, "");
  const conPrefijo = digitos.length <= 9 ? `34${digitos}` : digitos;
  return `wsp-${conPrefijo}@crm.local`;
}
