/**
 * Convierte una fecha ISO (UTC o con offset) al formato local requerido por `<input type="datetime-local">` (YYYY-MM-DDTHH:mm).
 */
export function toDatetimeLocal(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convierte el valor de `<input type="datetime-local">` a una cadena ISO 8601 (UTC).
 * Retorna `null` si el valor es vacío o no es una fecha válida.
 */
export function fromDatetimeLocal(localDateString: string): string | null {
  if (!localDateString) return null;
  const date = new Date(localDateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}
