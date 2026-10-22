// Conversor del Registro de Productos Fitosanitarios del MAPA (JSON) a la base SQLite de la app.
// Uso: node tool/datos/convertir.ts <JSON del MAPA> <base de salida .db>
// Se ejecuta con Node ≥ 22.6 (TypeScript sin compilar). Lo usará la acción semanal (tarea 5).
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { normalizar } from '../../src/datos/normalizar.ts';

export const VERSION_ESQUEMA = 1;

type Uso = Record<string, string | number | null | undefined>;
type Producto = {
  DATOSPRODUCTO: Record<string, string | number | null | undefined>;
  COMPOSICION?: Record<string, string | number | null | undefined>[];
  USOS?: Uso[];
};

/** El fichero es una cadena JSON con {Id, Tipo, Contenido, Fecha}; Contenido es otro JSON. */
export function leerRegistro(textoFichero: string): { fecha: string; productos: Producto[] } {
  const envoltorio = JSON.parse(JSON.parse(textoFichero));
  return {
    fecha: String(envoltorio.Fecha).slice(0, 10),
    productos: JSON.parse(envoltorio.Contenido).Productos,
  };
}

const texto = (v: unknown) => {
  const t = typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
  return t === '' ? null : t;
};

/** «2027/07/31» → «2027-07-31». */
export function fecha(v: unknown): string | null {
  const t = texto(v);
  if (!t) return null;
  const m = /^(\d{4})[/-](\d{2})[/-](\d{2})/.exec(t);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const SIN_PLAZO = new Set(['NP', 'N.P.', 'NO PROCEDE']);
const SIN_DATO = new Set(['-', '--', '—']);

/**
 * Plazo de seguridad: texto para mostrar y días para el filtro.
 * «NP», «N.P.» y «NO PROCEDE» → «NO PROCEDE». Con varios números (aire libre e invernadero),
 * el filtro usa el mayor, para no mostrar nunca un plazo más corto del real.
 */
export function plazo(v: unknown): { texto: string | null; dias: number | null } {
  const t = texto(v);
  if (!t || SIN_DATO.has(t)) return { texto: null, dias: null };
  if (SIN_PLAZO.has(t.toUpperCase())) return { texto: 'NO PROCEDE', dias: null };
  if (/^\d+$/.test(t)) return { texto: t, dias: Number(t) };
  const numeros = [...t.matchAll(/\d+/g)].map((m) => Number(m[0]));
  const conDias = /BBCH/i.test(t) ? [] : numeros;
  return { texto: t, dias: conDias.length ? Math.max(...conDias) : null };
}

/** Aplicaciones e intervalo: tal cual; «-» y vacío son «sin dato». */
export function textoUso(v: unknown): string | null {
  const t = texto(v);
  return !t || SIN_DATO.has(t) ? null : t;
}

/** Id estable de un cultivo: su código de 16 cifras como número (0101020702000000 → 101020702000000). */
export function idCultivo(codigo: string): number {
  const n = Number(codigo);
  if (!/^\d{16}$/.test(codigo) || !Number.isSafeInteger(n) || n === 0) {
    throw new Error(`CODIGO_CULTIVO_RARO: ${codigo}`);
  }
  return n;
}

/**
 * Id estable de una plaga: cada parte del código («6.2.2.3.10.1») en dos cifras, sumándole 1 para
 * que «1» y «1.0» no coincidan, hasta 7 niveles (07 03 03 04 11 02 00 → 7030304110200).
 */
export function idAgente(codigo: string): number {
  const partes = codigo.split('.');
  if (!/^\d+(\.\d+)*$/.test(codigo) || partes.length > 7 || partes.some((p) => Number(p) > 98)) {
    throw new Error(`CODIGO_PLAGA_RARO: ${codigo}`);
  }
  let n = 0;
  for (let i = 0; i < 7; i++) n = n * 100 + (i < partes.length ? Number(partes[i]) + 1 : 0);
  return n;
}

/** Tipo de plaga por el primer número del código del agente (D41). */
export function tipoPlaga(codigo: unknown): string {
  const grupo = String(codigo ?? '').split('.')[0];
  return (
    (
      {
        '6': 'artropodos',
        '8': 'hongos',
        '1': 'malas_hierbas',
        '9': 'bacterias',
        '10': 'virus',
        '11': 'nematodos',
      } as Record<string, string>
    )[grupo] ?? 'otros'
  );
}

export type Resumen = {
  fecha: string;
  productos: number;
  vigentes: number;
  usos: number;
  cultivos: number;
  agentes: number;
};

export function convertir(textoFichero: string, rutaSalida: string): Resumen {
  const { fecha: fechaDatos, productos } = leerRegistro(textoFichero);
  fs.rmSync(rutaSalida, { force: true });
  const db = new DatabaseSync(rutaSalida);
  db.exec(`
    PRAGMA journal_mode = OFF;
    PRAGMA page_size = 4096;
    CREATE TABLE info (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
    CREATE TABLE producto (
      id INTEGER PRIMARY KEY, registro TEXT NOT NULL, nombre TEXT NOT NULL, nombre_n TEXT NOT NULL,
      titular TEXT, formulado TEXT, estado TEXT NOT NULL, fecha_registro TEXT, caducidad TEXT,
      cancelacion TEXT, limite_venta TEXT, condicionamiento TEXT);
    CREATE TABLE sustancia (producto_id INTEGER NOT NULL, nombre TEXT NOT NULL, nombre_n TEXT NOT NULL,
      concentracion TEXT);
    CREATE TABLE cultivo (id INTEGER PRIMARY KEY, codigo TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL,
      nombre_n TEXT NOT NULL);
    CREATE TABLE agente (id INTEGER PRIMARY KEY, codigo TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL,
      nombre_n TEXT NOT NULL, tipo TEXT NOT NULL);
    CREATE TABLE texto (id INTEGER PRIMARY KEY, valor TEXT NOT NULL UNIQUE);
    CREATE TABLE uso (
      producto_id INTEGER NOT NULL, cultivo_id INTEGER NOT NULL, agente_id INTEGER NOT NULL,
      dosis_min REAL, dosis_max REAL, unidad TEXT, plazo TEXT, plazo_dias INTEGER,
      aplicaciones TEXT, intervalo TEXT, caldo TEXT, bbch TEXT, condicionamiento_id INTEGER,
      tipo_usuario TEXT, ambito TEXT, sistema TEXT, metodo TEXT);
  `);

  const insInfo = db.prepare('INSERT INTO info VALUES (?, ?)');
  insInfo.run('fecha_datos', fechaDatos);
  insInfo.run('version_esquema', String(VERSION_ESQUEMA));
  insInfo.run('origen', 'Registro de Productos Fitosanitarios, MAPA');

  const cultivos = new Map<string, number>();
  const agentes = new Map<string, number>();
  const textos = new Map<string, number>();
  const insCultivo = db.prepare('INSERT INTO cultivo VALUES (?, ?, ?, ?)');
  const insAgente = db.prepare('INSERT INTO agente VALUES (?, ?, ?, ?, ?)');
  const insTexto = db.prepare('INSERT INTO texto VALUES (?, ?)');
  // Los id de cultivo y de plaga salen de su código del MAPA: son los mismos en todas las
  // publicaciones, y la app los guarda (recientes) y los usa en pantallas abiertas al actualizar.
  const cultivoId = (codigo: string, nombre: string) => {
    let n = cultivos.get(codigo);
    if (n === undefined) {
      n = idCultivo(codigo);
      insCultivo.run(n, codigo, nombre, normalizar(nombre));
      cultivos.set(codigo, n);
    }
    return n;
  };
  const agenteId = (codigo: string, nombre: string) => {
    let n = agentes.get(codigo);
    if (n === undefined) {
      n = idAgente(codigo);
      insAgente.run(n, codigo, nombre, normalizar(nombre), tipoPlaga(codigo));
      agentes.set(codigo, n);
    }
    return n;
  };
  const textoId = (v: unknown) => {
    const t = texto(v);
    if (!t) return null;
    let n = textos.get(t);
    if (n === undefined) {
      n = textos.size + 1;
      insTexto.run(n, t);
      textos.set(t, n);
    }
    return n;
  };

  const insProd = db.prepare('INSERT INTO producto VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insSus = db.prepare('INSERT INTO sustancia VALUES (?, ?, ?, ?)');
  const insUso = db.prepare(
    'INSERT INTO uso VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );

  let usos = 0;
  let vigentes = 0;
  db.exec('BEGIN');
  for (const p of productos) {
    const d = p.DATOSPRODUCTO;
    const nombre = texto(d.Nombre) ?? '';
    const estado = texto(d.Estado) ?? 'Desconocido';
    if (estado === 'Vigente') vigentes++;
    insProd.run(
      Number(d.IdProducto),
      texto(d.Num_Registro) ?? '',
      nombre,
      normalizar(nombre),
      texto(d.Titular),
      texto(d.Formulado),
      estado,
      fecha(d.Fecha_Registro),
      fecha(d.Fecha_Caducidad),
      fecha(d.Fecha_Cancelacion),
      fecha(d.Fecha_LimiteVenta),
      texto(d.Condicionamiento),
    );
    for (const s of p.COMPOSICION ?? []) {
      const sustancia = texto(s['Nombre Sustancia']) ?? texto(s.NombreUE) ?? '';
      insSus.run(Number(d.IdProducto), sustancia, normalizar(sustancia), texto(s.Concentracion));
    }
    for (const u of p.USOS ?? []) {
      const pl = plazo(u['Plazo Seguridad']);
      insUso.run(
        Number(d.IdProducto),
        cultivoId(String(u.CodigoCultivo).trim(), texto(u.Cultivo) ?? ''),
        agenteId(String(u.CodigoAgente).trim(), texto(u.Agente) ?? ''),
        typeof u.Dosis_Min === 'number' ? u.Dosis_Min : null,
        typeof u.Dosis_Max === 'number' ? u.Dosis_Max : null,
        texto(u['Unidad Medida dosis']),
        pl.texto,
        pl.dias,
        textoUso(u.Aplicaciones),
        textoUso(u.IntervaloAplicaciones),
        textoUso(u['Volumen Caldo']),
        textoUso(u.Bbch),
        textoId(u.CondicionamientoEspecifico),
        texto(u.TipoUsuario),
        texto(u.Ambito),
        texto(u.SistemaCultivo),
        texto(u.MetodoAplicacion),
      );
      usos++;
    }
  }
  db.exec('COMMIT');
  db.exec(`
    CREATE INDEX uso_cultivo_agente ON uso(cultivo_id, agente_id);
    CREATE INDEX uso_producto ON uso(producto_id);
    CREATE INDEX producto_nombre ON producto(nombre_n);
    CREATE INDEX producto_registro ON producto(registro);
    CREATE INDEX sustancia_nombre ON sustancia(nombre_n);
    CREATE INDEX sustancia_producto ON sustancia(producto_id);
    CREATE INDEX cultivo_nombre ON cultivo(nombre_n);
    CREATE INDEX agente_nombre ON agente(nombre_n);
    ANALYZE;
    VACUUM;
  `);
  db.close();
  return {
    fecha: fechaDatos,
    productos: productos.length,
    vigentes,
    usos,
    cultivos: cultivos.size,
    agentes: agentes.size,
  };
}

// Ejecución directa: node tool/datos/convertir.ts <json> <salida.db>
if (process.argv[1]?.endsWith('convertir.ts')) {
  const [entrada, salida] = process.argv.slice(2);
  if (!entrada || !salida) {
    console.error('Uso: node tool/datos/convertir.ts <JSON del MAPA> <salida.db>');
    process.exit(1);
  }
  const resumen = convertir(fs.readFileSync(entrada, 'utf8'), salida);
  const mb = (fs.statSync(salida).size / 1024 / 1024).toFixed(1);
  console.log(JSON.stringify({ ...resumen, tamano: `${mb} MB` }, null, 1));
}
