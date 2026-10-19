// Comprueba la base convertida antes de publicarla y escribe version.json.
// Uso: node tool/datos/comprobar.ts <base.db> <base.db.gz> <version.json> [URL del version.json anterior]
// Salida: código 0 y «publicar» o «sin-cambios» en la última línea; código 1 si algo falla.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export type Medidas = {
  fechaDatos: string;
  versionEsquema: number;
  productos: number;
  usos: number;
  usosVidMildiu: number;
};

export type Version = {
  fecha_datos: string;
  version_esquema: number;
  archivo: string;
  bytes: number;
  bytes_gz: number;
  sha256_gz: string;
  generado: string;
};

export const LIMITES = { productosMin: 1500, productosMax: 3000, usosMin: 50000 };

export function medir(rutaBase: string): Medidas {
  const db = new DatabaseSync(rutaBase, { readOnly: true });
  try {
    const valor = (clave: string) =>
      (db.prepare('SELECT valor FROM info WHERE clave = ?').get(clave) as { valor: string })?.valor;
    const contar = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
    return {
      fechaDatos: valor('fecha_datos') ?? '',
      versionEsquema: Number(valor('version_esquema')),
      productos: contar('SELECT COUNT(*) n FROM producto'),
      usos: contar('SELECT COUNT(*) n FROM uso'),
      // Consulta de prueba: la de la maqueta (vid de vinificación + mildiu de la vid).
      usosVidMildiu: contar(`SELECT COUNT(*) n FROM uso u
        JOIN cultivo c ON c.id = u.cultivo_id JOIN agente a ON a.id = u.agente_id
        WHERE c.nombre_n = 'vid de vinificacion' AND a.nombre_n LIKE 'mildiu de la vid%'`),
    };
  } finally {
    db.close();
  }
}

/** Devuelve los errores (vacío = todo bien) y si hay que publicar. */
export function validar(
  m: Medidas,
  fechaAnterior: string | null,
): { errores: string[]; publicar: boolean } {
  const errores: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.fechaDatos)) errores.push(`FECHA_RARA: ${m.fechaDatos}`);
  if (m.productos < LIMITES.productosMin || m.productos > LIMITES.productosMax) {
    errores.push(`PRODUCTOS_FUERA_DE_RANGO: ${m.productos}`);
  }
  if (m.usos <= LIMITES.usosMin) errores.push(`POCOS_USOS: ${m.usos}`);
  if (m.usosVidMildiu === 0) errores.push('CONSULTA_DE_PRUEBA_VACIA');
  if (fechaAnterior && m.fechaDatos < fechaAnterior) {
    errores.push(`FECHA_ANTERIOR_A_LA_PUBLICADA: ${m.fechaDatos} < ${fechaAnterior}`);
  }
  const publicar = errores.length === 0 && (!fechaAnterior || m.fechaDatos > fechaAnterior);
  return { errores, publicar };
}

async function fechaPublicada(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (r.status === 404) return null; // todavía no hay ninguna publicación
  if (!r.ok) throw new Error(`VERSION_ANTERIOR_${r.status}`);
  return ((await r.json()) as Version).fecha_datos;
}

async function principal() {
  const [base, gz, salidaVersion, urlAnterior] = process.argv.slice(2);
  if (!base || !gz || !salidaVersion) {
    console.error('Uso: node tool/datos/comprobar.ts <base.db> <base.db.gz> <version.json> [URL]');
    process.exit(1);
  }
  const medidas = medir(base);
  if (process.env.FORZAR_FALLO === 'true') medidas.productos = 0; // prueba del aviso por correo
  const anterior = await fechaPublicada(urlAnterior);
  const { errores, publicar } = validar(medidas, anterior);
  console.log(JSON.stringify({ medidas, anterior }, null, 1));
  if (errores.length) {
    console.error(`No se publica:\n- ${errores.join('\n- ')}`);
    process.exit(1);
  }
  const datosGz = fs.readFileSync(gz);
  const version: Version = {
    fecha_datos: medidas.fechaDatos,
    version_esquema: medidas.versionEsquema,
    archivo: 'sulfata.db.gz',
    bytes: fs.statSync(base).size,
    bytes_gz: datosGz.length,
    sha256_gz: createHash('sha256').update(datosGz).digest('hex'),
    generado: new Date().toISOString(),
  };
  fs.writeFileSync(salidaVersion, JSON.stringify(version, null, 1) + '\n');
  console.log(publicar ? 'publicar' : 'sin-cambios');
}

if (process.argv[1]?.endsWith('comprobar.ts')) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
