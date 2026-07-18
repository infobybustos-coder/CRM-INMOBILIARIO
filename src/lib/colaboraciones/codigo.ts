// Sugerencia de código de referido a partir del nombre: primera palabra,
// sin acentos ni símbolos, en mayúsculas, + un sufijo numérico aleatorio
// para reducir choques. El superadmin puede sobrescribirlo libremente en
// el formulario antes de guardar — esto es solo el valor por defecto
// cuando lo deja vacío.
export function generarCodigoReferido(nombre: string): string {
  const base =
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/\s+/)[0]
      ?.replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8) || "COLAB";
  const sufijo = Math.floor(100 + Math.random() * 900);
  return `${base}${sufijo}`;
}

export function normalizarCodigoReferido(codigo: string): string {
  return codigo.trim().toUpperCase();
}

export function codigoReferidoValido(codigo: string): boolean {
  return /^[A-Z0-9]{3,20}$/.test(codigo);
}
