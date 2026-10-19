// Normalización para buscar sin acentos ni mayúsculas. La usan el conversor del MAPA
// (al crear la base) y la app (al buscar), así que tiene que ser la misma en los dos.

// Marcas de acento que deja normalize('NFD'): U+0300 a U+036F.
const ACENTOS = new RegExp('[\\u0300-\\u036f]', 'g');

/** «Viña de vinificación» → «vina de vinificacion». */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(ACENTOS, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
