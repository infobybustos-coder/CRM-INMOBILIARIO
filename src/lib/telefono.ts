import { prefijoPais } from "@/lib/paises";

export function normalizarTelefono(pais: string, numero: string) {
  const digitos = numero.replace(/\D/g, "");
  return `${prefijoPais(pais)}${digitos}`;
}

export function emailSinteticoDeTelefono(telefonoCompleto: string) {
  const digitos = telefonoCompleto.replace(/\D/g, "");
  return `wsp-${digitos}@crm.local`;
}

export function emailSinteticoDesdeIdentificador(identificador: string) {
  const digitos = identificador.replace(/\D/g, "");
  const conPrefijo = digitos.length <= 9 ? `34${digitos}` : digitos;
  return `wsp-${conPrefijo}@crm.local`;
}
