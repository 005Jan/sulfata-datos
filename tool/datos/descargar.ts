// Descarga el JSON de productos autorizados del Registro de Productos Fitosanitarios (MAPA).
// Uso: node tool/datos/descargar.ts <salida.json>
// Es una petición POST sin autenticación (botón «Productos autorizados (JSON)» de regfiweb).
import fs from 'node:fs';

export const URL_MAPA =
  'https://servicio.mapa.gob.es/regfiweb/Exportaciones/ExportJsonProductosAutorizados';
const TOPE_BYTES = 200 * 1024 * 1024;
const TIEMPO_MAXIMO_MS = 10 * 60 * 1000;

export async function descargar(salida: string): Promise<number> {
  const respuesta = await fetch(URL_MAPA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'tipoExportacion=ProductosAutorizados',
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
  });
  if (!respuesta.ok || !respuesta.body) {
    throw new Error(`MAPA_RESPUESTA_${respuesta.status}`);
  }
  const fichero = fs.createWriteStream(salida);
  let bytes = 0;
  try {
    for await (const trozo of respuesta.body) {
      bytes += trozo.length;
      if (bytes > TOPE_BYTES) throw new Error('MAPA_DEMASIADO_GRANDE');
      if (!fichero.write(trozo)) await new Promise((r) => fichero.once('drain', r));
    }
  } finally {
    await new Promise((r) => fichero.end(r));
  }
  return bytes;
}

async function principal() {
  const salida = process.argv[2];
  if (!salida) {
    console.error('Uso: node tool/datos/descargar.ts <salida.json>');
    process.exit(1);
  }
  const bytes = await descargar(salida);
  console.log(`Descargado: ${(bytes / 1024 / 1024).toFixed(1)} MB`);
}

if (process.argv[1]?.endsWith('descargar.ts')) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
