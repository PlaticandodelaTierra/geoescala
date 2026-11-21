// Eje de edades: marcas numéricas y edades de los límites (funciones puras, sin DOM).
//
// Las posiciones son a lo largo del eje del tiempo de la barra, en mm, como las de
// calcularLayout().limites. calcularFigura() (layout.js) las coloca junto a la barra.

import { ErrorGeoEscala } from './errores.js';
import { ALTO_TEXTO_EM, elegirSinChoques, medirTexto, textoDeLimite } from './labels.js';

export const TIPOS_DE_EJE = ['auto', 'intervalo', 'limites', 'ninguno'];
// Separación mínima entre marcas automáticas, en mm
export const SEPARACION_MARCAS_MM = 15;
// Más marcas que esto no se dibujan (el intervalo pedido sería demasiado pequeño)
export const MAX_MARCAS = 1000;
// Espacio mínimo entre dos números del eje, en fracciones del tamaño de la fuente
const SEPARACION_ETIQUETAS_EM = 0.6;

/** Paso "redondo" (1, 2 o 5 × 10ⁿ Ma) para que las marcas queden separadas al menos `separacion` mm. */
export function pasoAutomatico(duracion_ma, largo_mm, separacion = SEPARACION_MARCAS_MM) {
  const maxMarcas = Math.max(1, Math.floor(largo_mm / separacion));
  const bruto = duracion_ma / maxMarcas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const multiplo = [1, 2, 5, 10].find((m) => m * potencia >= bruto * (1 - 1e-12));
  return Number((multiplo * potencia).toPrecision(12));
}

/** Decimales con que se escriben los números de un paso (0.05 → 2, 2.5 → 1, 10 → 0). */
export function decimalesDe(paso) {
  const [mantisa, exponente] = Number(paso.toPrecision(12)).toExponential().split('e');
  const decimalesMantisa = mantisa.split('.')[1]?.length ?? 0;
  return Math.max(0, decimalesMantisa - Number(exponente));
}

/**
 * Marcas cada `paso` Ma dentro del intervalo: [{ ma, texto, k }], donde ma = k × paso.
 * Los números se escriben con los decimales del paso (0.3, no 0.30000000000000004).
 */
export function marcasCada(techo_ma, base_ma, paso) {
  if (!(paso > 0)) throw new Error(`El intervalo de las marcas debe ser mayor que 0 Ma (recibido: ${paso}).`);
  const d = decimalesDe(paso);
  const primera = Math.ceil(techo_ma / paso - 1e-9);
  const ultima = Math.floor(base_ma / paso + 1e-9);
  if (ultima - primera + 1 > MAX_MARCAS) {
    throw new ErrorGeoEscala(
      'demasiadas-marcas',
      { paso, max: MAX_MARCAS },
      `Con marcas cada ${paso} Ma habría más de ${MAX_MARCAS} marcas; usa un intervalo mayor.`,
    );
  }
  const marcas = [];
  for (let k = primera; k <= ultima; k++) {
    const ma = Number((k * paso).toFixed(d));
    marcas.push({ ma, texto: ma.toFixed(d), k });
  }
  return marcas;
}

/** Posición en mm a lo largo del eje del tiempo de una edad cualquiera (interpola entre límites). */
export function posicionDeEdad(geometria, ma) {
  const l = geometria.limites; // del más joven al más antiguo
  if (ma <= l[0].ma) return l[0].pos;
  if (ma >= l.at(-1).ma) return l.at(-1).pos;
  let lo = 0;
  let hi = l.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (l[m].ma <= ma) lo = m;
    else hi = m;
  }
  const t = (ma - l[lo].ma) / (l[hi].ma - l[lo].ma);
  return l[lo].pos + t * (l[hi].pos - l[lo].pos);
}

/**
 * Marcas y números del eje para una barra ya calculada (calcularLayout).
 * tipo: 'auto' | 'intervalo' (marcas numéricas, solo en escala proporcional) o 'limites'.
 * Regresa { marcas: [{ ma, pos }], etiquetas: [{ ma, pos, texto, extension }], paso }.
 * Solo se dejan los números que no se enciman; en 'limites' ganan los límites de las
 * unidades mayores y los extremos del intervalo.
 */
export function marcasDelEje(tipo, geometria, unidades, { tamano_mm, paso_ma, incertidumbre = false }) {
  const horizontal = geometria.orientacion === 'horizontal';
  const largo = horizontal ? geometria.ancho_mm : geometria.alto_mm;
  // Lo que ocupa un número a lo largo del eje
  const extension = (texto) => (horizontal ? medirTexto(texto, tamano_mm) : ALTO_TEXTO_EM * tamano_mm);
  const separacion = SEPARACION_ETIQUETAS_EM * tamano_mm;

  if (tipo === 'limites') {
    // Prioridad de cada límite: la fila más gruesa en que es borde de una celda
    const prioridad = new Map([
      [geometria.techo_ma, -1],
      [geometria.base_ma, -1],
    ]);
    for (const c of geometria.celdas) {
      for (const ma of [c.techo_ma, c.base_ma]) prioridad.set(ma, Math.min(prioridad.get(ma) ?? Infinity, c.fila));
    }
    const candidatas = geometria.limites.map((l) => {
      const texto = textoDeLimite(l.ma, unidades, { incertidumbre });
      return { ma: l.ma, pos: l.pos, texto, extension: extension(texto), prioridad: prioridad.get(l.ma) };
    });
    const etiquetas = elegirSinChoques(candidatas, separacion).map(({ prioridad, ...e }) => e);
    return { marcas: etiquetas.map(({ ma, pos }) => ({ ma, pos })), etiquetas, paso: null };
  }

  const paso =
    tipo === 'auto' ? pasoAutomatico(geometria.base_ma - geometria.techo_ma, largo) : paso_ma;
  const marcas = marcasCada(geometria.techo_ma, geometria.base_ma, paso).map((m) => ({
    ...m,
    pos: posicionDeEdad(geometria, m.ma),
  }));
  if (marcas.length === 0) return { marcas: [], etiquetas: [], paso };

  // Si los números no caben en cada marca, se escriben cada 2, 5, 10… marcas
  const necesaria = Math.max(...marcas.map((m) => extension(m.texto))) + separacion;
  const entreMarcas = marcas.length > 1 ? Math.abs(marcas[1].pos - marcas[0].pos) : Infinity;
  let cada = 1;
  for (let n = 0; cada * entreMarcas < necesaria; n++) cada = [2, 5, 10][n % 3] * 10 ** Math.floor(n / 3);
  const etiquetas = marcas
    .filter((m) => m.k % cada === 0)
    .map(({ ma, pos, texto }) => ({ ma, pos, texto, extension: extension(texto) }));
  return { marcas: marcas.map(({ ma, pos }) => ({ ma, pos })), etiquetas, paso };
}
