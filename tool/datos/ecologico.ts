// Sustancias permitidas en producción ecológica (tarea 49, D86): anexo I del Reglamento de
// Ejecución (UE) 2021/1165, versión consolidada del 1 de enero de 2026
// (https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:02021R1165-20260101).
// Un producto se marca solo si TODAS sus sustancias están en el anexo; las condiciones se
// enseñan tal cual. Lo que no está aquí no se marca, pero la app nunca dice «no apto».
// Las reglas comparan con el nombre normalizado de la sustancia en el registro del MAPA.
import { normalizar } from '../../src/datos/normalizar.ts';

export const FUENTE_ECOLOGICO = 'Reglamento de Ejecución (UE) 2021/1165, anexo I (01/01/2026)';

export type Regla = {
  /** Denominación del anexo I. */
  anexo: string;
  /** Apartado del anexo: 1 básicas, 2 bajo riesgo, 3 microorganismos, 4 otras. */
  apartado: 1 | 2 | 3 | 4;
  /** Busca en el nombre normalizado de la sustancia del registro. */
  patron: RegExp;
  /** Condiciones del anexo para ecológico; null si no pone ninguna. */
  condicion: string | null;
  /** Solo vale con este formulado (las piretroides, solo en trampas: cebo [RB]). */
  formulado?: RegExp;
  /**
   * Solo vale si TODAS las plagas de los usos del producto cumplen esto (nombre normalizado).
   * Las trampas de piretroides, solo contra las moscas que dice el anexo (revisión de la 1.1).
   */
  plagas?: RegExp;
};

const SIN_HERBICIDA = 'Todas las utilizaciones autorizadas, salvo como herbicida.';
const COBRE =
  'Como máximo 28 kg de cobre por hectárea en 7 años (sumando todos los productos con cobre).';
const NO_OMG = 'No procedente de OMG.';

export const REGLAS: Regla[] = [
  // 1. Sustancias básicas (las que hay hoy en el registro, y las demás del cuadro)
  { anexo: 'Equisetum arvense L.', apartado: 1, patron: /equisetum/, condicion: null },
  {
    anexo: 'Quitosano / clorhidrato de quitosano',
    apartado: 1,
    patron: /quitosano/,
    condicion:
      'Obtenido de Aspergillus, de la acuicultura ecológica o de la pesca sostenible (Reglamento (UE) 1380/2013).',
  },
  { anexo: 'Sacarosa', apartado: 1, patron: /^sacarosa/, condicion: null },
  { anexo: 'Hidróxido de calcio', apartado: 1, patron: /hidroxido de calcio/, condicion: null },
  { anexo: 'Vinagre', apartado: 1, patron: /^vinagre/, condicion: null },
  { anexo: 'Lecitinas', apartado: 1, patron: /^lecitina/, condicion: null },
  { anexo: 'Salix spp. Cortex', apartado: 1, patron: /salix/, condicion: null },
  { anexo: 'Fructosa', apartado: 1, patron: /^fructosa/, condicion: null },
  {
    anexo: 'Hidrogenocarbonato de sodio',
    apartado: 1,
    patron: /hidrogenocarbonato de sodio|carbonato acido de sodio|bicarbonato sodico/,
    condicion: null,
  },
  { anexo: 'Suero lácteo', apartado: 1, patron: /suero lacteo/, condicion: null },
  {
    anexo: 'Fosfato diamónico',
    apartado: 1,
    patron: /fosfato diamonico/,
    condicion: 'Solo en trampas.',
  },
  { anexo: 'Aceite de girasol', apartado: 1, patron: /aceite de girasol/, condicion: null },
  { anexo: 'Urtica spp.', apartado: 1, patron: /urtica/, condicion: null },
  { anexo: 'Peróxido de hidrógeno', apartado: 1, patron: /peroxido de hidrogeno/, condicion: null },
  { anexo: 'Cloruro sódico', apartado: 1, patron: /cloruro sodico/, condicion: null },
  { anexo: 'Cerveza', apartado: 1, patron: /^cerveza/, condicion: null },
  {
    anexo: 'Polvo de semillas de mostaza',
    apartado: 1,
    patron: /semillas de mostaza/,
    condicion: null,
  },
  { anexo: 'Talco (E 553b)', apartado: 1, patron: /talco/, condicion: null },
  { anexo: 'Aceite de cebolla', apartado: 1, patron: /aceite de cebolla/, condicion: null },
  { anexo: 'L-cisteína', apartado: 1, patron: /l-cisteina/, condicion: null },
  { anexo: 'Leche de vaca', apartado: 1, patron: /leche de vaca/, condicion: null },
  {
    anexo: 'Extracto de bulbo de Allium cepa',
    apartado: 1,
    patron: /allium cepa/,
    condicion: null,
  },

  // 2. Sustancias de bajo riesgo
  { anexo: 'COS-OGA', apartado: 2, patron: /cos-oga/, condicion: null },
  { anexo: 'Cerevisane', apartado: 2, patron: /cerevisane/, condicion: NO_OMG },
  {
    anexo: 'Fosfato férrico [ortofosfato de hierro (III)]',
    apartado: 2,
    patron: /^fosfato ferrico|ortofosfato de hierro/,
    condicion: null,
  },
  {
    anexo: 'Laminarina',
    apartado: 2,
    patron: /^laminarin/,
    condicion:
      'El kelp debe proceder de la acuicultura ecológica o de recolección sostenible (Reglamento (UE) 2018/848, anexo II, parte III, punto 2.4).',
  },
  {
    anexo: 'ABE-IT 56 (lisado de Saccharomyces cerevisiae DDSF623)',
    apartado: 2,
    patron: /abe[ -]?it ?56/,
    condicion: 'No procedente de OMG ni obtenido con sustratos de cultivo de origen OMG.',
  },
  {
    anexo: 'Senecioato de lavandulilo',
    apartado: 2,
    patron: /senecioato de lavandulilo/,
    condicion: null,
  },
  { anexo: 'Pirofosfato férrico', apartado: 2, patron: /pirofosfato ferrico/, condicion: null },
  {
    anexo: 'Extracto acuoso de semillas germinadas de Lupinus albus dulce',
    apartado: 2,
    patron: /lupinus albus/,
    condicion: null,
  },
  {
    anexo: 'Hidrogenocarbonato de potasio',
    apartado: 2,
    patron: /hidrogenocarbonato de potasio|bicarbonato potasico/,
    condicion: null,
  },
  {
    anexo: 'Grasa de ovino',
    apartado: 2,
    patron: /grasa de ovino/,
    condicion: 'Solo como repelente por el olor.',
  },
  {
    anexo: 'Arena de cuarzo / dióxido de silicio',
    apartado: 2,
    patron: /arena de cuarzo|dioxido de silicio/,
    condicion: null,
  },

  // 3. Microorganismos (todos los aprobados; los del registro lo están)
  {
    anexo: 'Microorganismos (hongos, bacterias, levaduras y virus)',
    apartado: 3,
    patron:
      /bacillus|beauver|beauvaria|trichoderma|aureobasidium|ampelomi?yces|ampelomices|akanthomyces|lecanicillium|candida oleophila|coniothyrium|glioc?l?adium|granulovirus|virus|isaria|metarhizium|paecilomyces|purpureocillium|pseudomonas|pythium oligandrum|saccharomyces/,
    condicion: NO_OMG,
  },

  // 4. Otras sustancias activas
  { anexo: 'Spinosad', apartado: 4, patron: /spinosad/, condicion: null },
  { anexo: 'Dióxido de carbono', apartado: 4, patron: /dioxido de carbono/, condicion: null },
  {
    anexo: 'Etileno',
    apartado: 4,
    patron: /^etileno/,
    condicion:
      'Solo para plátanos y patatas; también en cítricos dentro de una estrategia de prevención de la mosca de la fruta.',
  },
  {
    anexo: 'Ácidos grasos',
    apartado: 4,
    patron: /acidos grasos|acido caprilico|acido caprico/,
    condicion: SIN_HERBICIDA,
  },
  {
    anexo: 'Extracto de ajo (Allium sativum)',
    apartado: 4,
    patron: /extracto de ajo/,
    condicion: null,
  },
  {
    anexo: 'Proteínas hidrolizadas (salvo la gelatina)',
    apartado: 4,
    patron: /proteinas hidrolizadas/,
    condicion: 'Salvo la gelatina.',
  },
  {
    anexo: 'Silicato de aluminio (caolín)',
    apartado: 4,
    patron: /caolin|silicato de aluminio/,
    condicion: null,
  },
  {
    anexo: 'Kieselgur (tierra de diatomeas)',
    apartado: 4,
    patron: /diatomeas|kieselgur/,
    condicion: null,
  },
  {
    anexo: 'Azadiractina (extracto de margosa)',
    apartado: 4,
    patron: /azadiract/,
    condicion: 'Extraída de semillas de neem (Azadirachta indica).',
  },
  { anexo: 'Aceite de citronela', apartado: 4, patron: /citronela/, condicion: SIN_HERBICIDA },
  { anexo: 'Aceite de clavo', apartado: 4, patron: /aceite de clavo/, condicion: SIN_HERBICIDA },
  {
    anexo: 'Aceite de colza',
    apartado: 4,
    patron: /^aceite de colza|^aceites vegetales\/aceite de colza|^aceite de canola/,
    condicion: SIN_HERBICIDA,
  },
  {
    anexo: 'Aceite de menta verde',
    apartado: 4,
    patron: /aceite de menta/,
    condicion: SIN_HERBICIDA,
  },
  {
    anexo: 'Aceite de naranja',
    apartado: 4,
    patron: /aceite de naranja/,
    condicion: SIN_HERBICIDA,
  },
  {
    anexo: 'Aceite del árbol del té',
    apartado: 4,
    patron: /arbol del te|melaleuca/,
    condicion: SIN_HERBICIDA,
  },
  { anexo: 'Piretrinas extraídas de plantas', apartado: 4, patron: /^piretrinas/, condicion: null },
  { anexo: 'Azufre', apartado: 4, patron: /^azufre/, condicion: null },
  { anexo: 'Aceites de parafina', apartado: 4, patron: /aceite de parafina/, condicion: null },
  { anexo: 'Polisulfuro de calcio', apartado: 4, patron: /polisulfuro de calcio/, condicion: null },
  { anexo: 'Maltodextrina', apartado: 4, patron: /maltodextrina/, condicion: null },
  { anexo: 'Eugenol', apartado: 4, patron: /^eugenol/, condicion: null },
  { anexo: 'Geraniol', apartado: 4, patron: /^geraniol/, condicion: null },
  { anexo: 'Timol', apartado: 4, patron: /^timol/, condicion: null },
  {
    anexo: 'Feromonas y otros semioquímicos',
    apartado: 4,
    // Alcoholes, acetatos y aldehídos de cadena lineal insaturada (decenol, dodecadienol,
    // tetradecenal…) y los saturados de las mezclas de feromonas (dodecan-1-ol, tetradecan-1-ol).
    // No el 1-decanol: es un regulador de crecimiento, no está en el anexo.
    patron: /dec(en|adien|atrien)|dodecan-1-|tetradecan-1-|rescalure|feromona/,
    condicion: null,
  },
  {
    anexo: 'Compuestos de cobre: hidróxido, oxicloruro, óxido, caldo bordelés y sulfato tribásico',
    apartado: 4,
    patron:
      /hidroxido cuprico|hidroxido de cobre|oxicloruro de cobre|oxido cuproso|oxido de cobre|caldo bordeles|sulfato cuprocalcico|sulfato tribasico de cobre/,
    condicion: COBRE,
  },
  {
    anexo: 'Deltametrina',
    apartado: 4,
    patron: /^deltametrin/,
    formulado: /\[RB\]/,
    plagas: /bactrocera oleae|ceratitis capitata|rhagoletis completa/,
    condicion:
      'Solo en trampas con atrayentes específicos contra Bactrocera oleae, Ceratitis capitata y Rhagoletis completa.',
  },
  {
    anexo: 'Lambda-cihalotrina',
    apartado: 4,
    patron: /^lambda[ -]cihalotrin/,
    formulado: /\[RB\]/,
    plagas: /bactrocera oleae|ceratitis capitata/,
    condicion:
      'Solo en trampas con atrayentes específicos contra Bactrocera oleae y Ceratitis capitata.',
  },
];

/** La regla del anexo que cubre esta sustancia del registro, o null. */
export function reglaDe(
  sustancia: string,
  formulado: string | null = null,
  plagas: string[] = [],
): Regla | null {
  const n = normalizar(sustancia);
  const nombres = plagas.map(normalizar);
  return (
    REGLAS.find(
      (r) =>
        r.patron.test(n) &&
        (!r.formulado || r.formulado.test(formulado ?? '')) &&
        (!r.plagas || (nombres.length > 0 && nombres.every((p) => r.plagas!.test(p)))),
    ) ?? null
  );
}

/**
 * Si el producto entra en ecológico: todas sus sustancias tienen regla. Devuelve las condiciones
 * (sin repetir) o null si no entra. Un producto sin sustancias no entra. `plagas` son los
 * nombres de las plagas de sus usos (para las reglas que las limitan).
 */
export function ecologico(
  sustancias: string[],
  formulado: string | null,
  plagas: string[] = [],
): string[] | null {
  if (!sustancias.length) return null;
  const condiciones: string[] = [];
  for (const s of sustancias) {
    const r = reglaDe(s, formulado, plagas);
    if (!r) return null;
    if (r.condicion && !condiciones.includes(r.condicion)) condiciones.push(r.condicion);
  }
  return condiciones;
}
