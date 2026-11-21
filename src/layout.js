// Cálculo de la geometría de la escala de tiempo (funciones puras, sin DOM).
//
// Recibe las unidades de data/ics-*.json y las opciones de la figura, y regresa rectángulos
// en milímetros, listos para dibujarse en SVG (1 unidad del viewBox = 1 mm).
//
// Convenciones:
// - Filas: una por rango elegido, del más grueso (eón) al más fino (edad). En horizontal van
//   de arriba hacia abajo; en vertical, de izquierda a derecha (como en la carta ICS). Todas
//   las filas tienen el mismo grosor.
// - Eje del tiempo: en horizontal, lo más antiguo a la izquierda; en vertical, lo más antiguo
//   abajo. `invertir` cambia el sentido.
// - Donde un rango no tiene unidades (p. ej. el Precámbrico no tiene épocas ni edades), la
//   celda de la unidad más fina de un rango superior se extiende para cubrir el hueco, como
//   en la carta oficial. Esa unidad puede ser de un rango que no se eligió: con las filas
//   periodo/época/edad, las eras del Arqueano ocupan las tres filas porque no hay periodos.
//
// calcularLayout() calcula solo la barra; calcularFigura() la combina con el eje de edades y
// las etiquetas, dentro del tamaño pedido.

import { marcasDelEje, TIPOS_DE_EJE } from './eje.js';
import { ErrorGeoEscala } from './errores.js';
import {
  AJUSTE_LINEA_BASE_EM,
  ALTO_TEXTO_EM,
  ALTURA_MAYUSCULAS_EM,
  aGris,
  etiquetasDeCeldas,
  lineasDelPie,
  medirTexto,
  nombreDeUnidad,
  TERMINOLOGIAS,
} from './labels.js';

export const RANGOS = ['eon', 'era', 'periodo', 'epoca', 'edad'];
export const ORIENTACIONES = ['horizontal', 'vertical'];
export const ESCALAS = ['proporcional', 'uniforme'];

const MM_POR_PULGADA = 25.4;
const PT_POR_PULGADA = 72;

/** Milímetros → píxeles a la resolución indicada (96 dpi es la de CSS en pantalla). */
export function mmAPx(mm, dpi = 96) {
  return (mm / MM_POR_PULGADA) * dpi;
}

/** Píxeles → milímetros a la resolución indicada. */
export function pxAMm(px, dpi = 96) {
  return (px / dpi) * MM_POR_PULGADA;
}

/** Puntos tipográficos (1/72 de pulgada) → milímetros. */
export function ptAMm(pt) {
  return (pt / PT_POR_PULGADA) * MM_POR_PULGADA;
}

function esNumero(x) {
  return typeof x === 'number' && Number.isFinite(x);
}

/** Revisa las opciones, completa los valores por defecto y ordena los rangos. */
function normalizarOpciones(unidades, opciones = {}) {
  const {
    techo_ma = 0,
    base_ma,
    rangos,
    orientacion = 'horizontal',
    escala = 'proporcional',
    ancho_mm,
    alto_mm,
    invertir = false,
  } = opciones;

  if (!Array.isArray(unidades) || unidades.length === 0) {
    throw new Error('No hay unidades para dibujar.');
  }
  if (!esNumero(techo_ma) || techo_ma < 0) {
    throw new Error(`El techo del intervalo debe ser un número ≥ 0 Ma (recibido: ${techo_ma}).`);
  }
  if (!esNumero(base_ma) || base_ma <= techo_ma) {
    throw new Error(
      `La base del intervalo (${base_ma} Ma) debe ser más antigua (mayor) que el techo (${techo_ma} Ma).`,
    );
  }
  const baseMaxima = Math.max(...unidades.map((u) => u.base_ma));
  if (base_ma > baseMaxima) {
    throw new Error(`La base del intervalo (${base_ma} Ma) es más antigua que la Tierra (${baseMaxima} Ma).`);
  }
  if (!Array.isArray(rangos) || rangos.length === 0) {
    throw new Error('Elige al menos un rango (eón, era, periodo, época o edad).');
  }
  for (const r of rangos) {
    if (!RANGOS.includes(r)) throw new Error(`Rango desconocido: "${r}".`);
  }
  if (new Set(rangos).size !== rangos.length) throw new Error('Hay rangos repetidos.');
  if (!ORIENTACIONES.includes(orientacion)) {
    throw new Error(`Orientación desconocida: "${orientacion}" (usa "horizontal" o "vertical").`);
  }
  if (!ESCALAS.includes(escala)) {
    throw new Error(`Escala desconocida: "${escala}" (usa "proporcional" o "uniforme").`);
  }
  for (const [nombre, valor] of [['ancho', ancho_mm], ['alto', alto_mm]]) {
    if (!esNumero(valor) || valor <= 0) {
      throw new Error(`El ${nombre} de la figura debe ser un número mayor que 0 mm (recibido: ${valor}).`);
    }
  }

  return {
    techo_ma,
    base_ma,
    // Las filas siempre van del rango más grueso al más fino, sin importar el orden recibido
    rangos: RANGOS.filter((r) => rangos.includes(r)),
    orientacion,
    escala,
    ancho_mm,
    alto_mm,
    invertir: Boolean(invertir),
  };
}

/**
 * Asigna una unidad a cada fila y tramo de tiempo, y une las celdas iguales.
 *
 * 1. Divide el intervalo en tramos elementales (entre dos límites consecutivos).
 * 2. En cada fila, cada tramo lleva la unidad del rango de la fila; si no existe, la unidad
 *    más fina de un rango superior que lo cubra (así se extienden las celdas).
 * 3. Une los tramos consecutivos con la misma unidad (a lo largo del tiempo) y, si la misma
 *    unidad ocupa el mismo tramo en filas consecutivas, las une en una sola celda.
 *
 * Regresa [{ unidad, fila, n_filas, techo_ma, base_ma }], con las edades ya recortadas al
 * intervalo; `fila` es el índice de la primera fila que ocupa (0 = la más gruesa).
 */
export function asignarCeldas(unidades, { techo_ma, base_ma, rangos }) {
  const niveles = rangos.map((r) => RANGOS.indexOf(r));
  const nivelMasFino = Math.max(...niveles);

  // Unidades que tocan el intervalo y que pueden aparecer (los rangos más finos que la última
  // fila no se usan)
  const candidatas = unidades.filter(
    (u) => RANGOS.indexOf(u.rango) <= nivelMasFino && u.base_ma > techo_ma && u.techo_ma < base_ma,
  );
  const porNivel = RANGOS.map((r) => candidatas.filter((u) => u.rango === r));

  const cortes = new Set([techo_ma, base_ma]);
  for (const u of candidatas) {
    for (const ma of [u.techo_ma, u.base_ma]) {
      if (ma > techo_ma && ma < base_ma) cortes.add(ma);
    }
  }
  const bordes = [...cortes].sort((a, b) => a - b);
  const tramos = bordes.slice(1).map((b, i) => [bordes[i], b]);

  const celdas = [];
  let abiertas = new Map(); // celdas de la fila anterior, por unidad y tramo

  niveles.forEach((nivel, fila) => {
    // Tramos consecutivos con la misma unidad
    const corridas = [];
    for (const [a, b] of tramos) {
      const medio = (a + b) / 2;
      let unidad;
      for (let n = nivel; n >= 0 && !unidad; n--) {
        unidad = porNivel[n].find((u) => u.techo_ma < medio && medio < u.base_ma);
      }
      if (!unidad) throw new Error(`Ninguna unidad cubre el tramo ${a}–${b} Ma.`);
      const ultima = corridas.at(-1);
      if (ultima && ultima.unidad === unidad) ultima.base_ma = b;
      else corridas.push({ unidad, techo_ma: a, base_ma: b });
    }

    // Si la fila anterior tiene la misma unidad en el mismo tramo, la celda se extiende
    const nuevas = new Map();
    for (const c of corridas) {
      const clave = `${c.unidad.id}|${c.techo_ma}|${c.base_ma}`;
      let celda = abiertas.get(clave);
      if (celda) {
        celda.n_filas += 1;
      } else {
        celda = { ...c, fila, n_filas: 1 };
        celdas.push(celda);
      }
      nuevas.set(clave, celda);
    }
    abiertas = nuevas;
  });

  return celdas;
}

/**
 * Función que convierte una edad en una fracción del eje: 0 en el techo, 1 en la base.
 * - Proporcional: lineal en Ma.
 * - Uniforme: cada celda de la fila más fina mide lo mismo. Si el intervalo recorta una
 *   unidad, su celda mide solo la parte visible (p. ej. la mitad si se ve la mitad).
 *   Entre dos límites, la posición se interpola linealmente.
 */
function crearFraccion({ techo_ma, base_ma, escala }, filaMasFina) {
  if (escala === 'proporcional') {
    return (ma) => (ma - techo_ma) / (base_ma - techo_ma);
  }

  const bordes = [techo_ma];
  const acumulado = [0];
  for (const c of filaMasFina) {
    const peso = (c.base_ma - c.techo_ma) / (c.unidad.base_ma - c.unidad.techo_ma);
    bordes.push(c.base_ma);
    acumulado.push(acumulado.at(-1) + peso);
  }
  const total = acumulado.at(-1);

  return (ma) => {
    // Último borde ≤ ma (búsqueda binaria)
    let lo = 0;
    let hi = bordes.length - 1;
    while (lo < hi) {
      const m = Math.ceil((lo + hi) / 2);
      if (bordes[m] <= ma) lo = m;
      else hi = m - 1;
    }
    if (bordes[lo] === ma || lo === bordes.length - 1) return acumulado[lo] / total;
    const t = (ma - bordes[lo]) / (bordes[lo + 1] - bordes[lo]);
    return (acumulado[lo] + t * (acumulado[lo + 1] - acumulado[lo])) / total;
  };
}

/** Inicio de la fila i (de n) a lo largo de un grosor total; la última termina justo en el total. */
function corteDeFila(i, n, total) {
  return i === n ? total : (i * total) / n;
}

/**
 * Calcula la geometría completa de la escala.
 *
 * opciones: { techo_ma = 0, base_ma, rangos, orientacion = 'horizontal',
 *             escala = 'proporcional', ancho_mm, alto_mm, invertir = false }
 *
 * Regresa { ancho_mm, alto_mm, orientacion, escala, invertir, techo_ma, base_ma,
 *           filas, celdas, limites }:
 * - filas: el rango de cada fila, de la más gruesa a la más fina.
 * - celdas: [{ id, rango, nombre_es, nombre_en, abrev, color, informal, fila, n_filas,
 *              techo_ma, base_ma, recortada, x, y, ancho, alto }], en mm.
 * - limites: [{ ma, pos }] de la fila más fina, del más joven al más antiguo; pos es la
 *   distancia en mm desde el inicio del eje del tiempo (izquierda o arriba).
 */
export function calcularLayout(unidades, opciones) {
  const op = normalizarOpciones(unidades, opciones);
  const n = op.rangos.length;
  const horizontal = op.orientacion === 'horizontal';

  const asignadas = asignarCeldas(unidades, op);
  const filaMasFina = asignadas
    .filter((c) => c.fila + c.n_filas === n)
    .sort((a, b) => a.techo_ma - b.techo_ma);

  const fraccion = crearFraccion(op, filaMasFina);
  const largo = horizontal ? op.ancho_mm : op.alto_mm; // a lo largo del tiempo
  const grosor = horizontal ? op.alto_mm : op.ancho_mm; // a lo ancho de las filas
  // Por defecto, lo más antiguo va al inicio del eje en horizontal (izquierda) y al final en
  // vertical (abajo)
  const antiguoAlInicio = horizontal !== op.invertir;
  const posicion = (ma) => {
    const f = fraccion(ma);
    return antiguoAlInicio ? (1 - f) * largo : f * largo;
  };

  const celdas = asignadas.map((c) => {
    const u = c.unidad;
    const p1 = posicion(c.techo_ma);
    const p2 = posicion(c.base_ma);
    const t1 = corteDeFila(c.fila, n, grosor);
    const t2 = corteDeFila(c.fila + c.n_filas, n, grosor);
    const tiempo = { inicio: Math.min(p1, p2), largo: Math.abs(p2 - p1) };
    const filas = { inicio: t1, largo: t2 - t1 };
    const [ejeX, ejeY] = horizontal ? [tiempo, filas] : [filas, tiempo];
    return {
      id: u.id,
      rango: u.rango,
      nombre_es: u.nombre_es,
      nombre_en: u.nombre_en,
      abrev: u.abrev ?? null,
      color: u.color,
      informal: u.informal === true,
      fila: c.fila,
      n_filas: c.n_filas,
      techo_ma: c.techo_ma,
      base_ma: c.base_ma,
      recortada: c.techo_ma !== u.techo_ma || c.base_ma !== u.base_ma,
      x: ejeX.inicio,
      y: ejeY.inicio,
      ancho: ejeX.largo,
      alto: ejeY.largo,
    };
  });

  const limites = [op.techo_ma, ...filaMasFina.map((c) => c.base_ma)].map((ma) => ({
    ma,
    pos: posicion(ma),
  }));

  return {
    ancho_mm: op.ancho_mm,
    alto_mm: op.alto_mm,
    orientacion: op.orientacion,
    escala: op.escala,
    invertir: op.invertir,
    techo_ma: op.techo_ma,
    base_ma: op.base_ma,
    filas: op.rangos,
    celdas,
    limites,
  };
}

// --- Figura completa: barra + eje + etiquetas ---------------------------------------------

// Medidas del eje, en mm
const LARGO_MARCA_MM = 1;
const SEPARACION_NUMEROS_MM = 0.6; // entre la marca y los números
const SEPARACION_TITULO_MM = 0.8; // entre los números y el título
const TITULO_DEL_EJE = { es: 'Edad (Ma)', en: 'Age (Ma)' };
// Pie de figura
const SEPARACION_PIE_MM = 1; // entre la barra (o el eje) y el pie
const INTERLINEA_EM = 1.2;

/**
 * Calcula la figura completa dentro del tamaño pedido (ancho_mm × alto_mm): la barra, el eje
 * de edades (abajo en horizontal, a la derecha en vertical) y las etiquetas de las celdas.
 * La barra se acorta para dejar lugar al eje y a los números de los extremos.
 *
 * opciones: las de calcularLayout() más
 *   { tamano_fuente_pt = 7, idioma = 'es', terminologia = 'cronoestratigrafica', rotar = true,
 *     eje = 'auto' | 'intervalo' | 'limites' | 'ninguno', eje_paso_ma = 10, incertidumbre = false,
 *     pie = null (texto del pie de figura, p. ej. textoDelPie(version)), grises = false }
 *
 * En escala uniforme el eje no es lineal: 'auto' e 'intervalo' muestran las edades de los
 * límites ('limites'); eje.tipo dice cuál se usó.
 *
 * Regresa { ancho_mm, alto_mm, orientacion, escala, invertir, techo_ma, base_ma, filas,
 *           tamano_fuente_mm, barra: { x, y, ancho, alto }, celdas, limites, etiquetas, eje,
 *           pie: { lineas: [{ texto, x, y }] } | null, pie_omitido }
 * con todas las coordenadas en mm desde la esquina superior izquierda de la figura.
 */
export function calcularFigura(unidades, opciones = {}) {
  const {
    tamano_fuente_pt = 7,
    idioma = 'es',
    terminologia = 'cronoestratigrafica',
    rotar = true,
    eje = 'auto',
    eje_paso_ma = 10,
    incertidumbre = false,
    pie = null,
    grises = false,
    ...opcionesBarra
  } = opciones;
  if (!esNumero(tamano_fuente_pt) || tamano_fuente_pt <= 0) {
    throw new Error(`El tamaño de la fuente debe ser un número mayor que 0 pt (recibido: ${tamano_fuente_pt}).`);
  }
  if (!TIPOS_DE_EJE.includes(eje)) throw new Error(`Tipo de eje desconocido: "${eje}".`);
  if (!TERMINOLOGIAS.includes(terminologia)) throw new Error(`Terminología desconocida: "${terminologia}".`);

  const op = normalizarOpciones(unidades, opcionesBarra);
  const tamano = ptAMm(tamano_fuente_pt);
  const horizontal = op.orientacion === 'horizontal';
  const W = op.ancho_mm;
  // El pie va abajo, en una o dos líneas; si no cabe ni en dos, se omite (pie_omitido)
  const lineasPie = pie ? lineasDelPie(pie, W, tamano) : null;
  const altoPie = lineasPie ? SEPARACION_PIE_MM + lineasPie.length * INTERLINEA_EM * tamano : 0;
  const H = op.alto_mm - altoPie; // alto para la barra y el eje
  if (H < 1) {
    throw new ErrorGeoEscala(
      'figura-baja-para-pie',
      {},
      'La figura es demasiado baja para el pie; aumenta el alto u oculta el pie.',
    );
  }
  const tipo = op.escala === 'uniforme' && (eje === 'auto' || eje === 'intervalo') ? 'limites' : eje;
  const contexto = { tamano_mm: tamano, paso_ma: eje_paso_ma, incertidumbre };

  let barra = { x: 0, y: 0, ancho: W, alto: H };
  let delEje = null;
  let anchoNumeros = 0;

  if (tipo !== 'ninguno') {
    const largoTotal = horizontal ? W : H;
    // Las posiciones a lo largo del tiempo no dependen del grosor de la barra
    const barraDeLargo = (largo) =>
      calcularLayout(unidades, { ...op, ...(horizontal ? { ancho_mm: largo } : { alto_mm: largo }) });
    const sinEspacio = () =>
      new ErrorGeoEscala(
        'figura-pequena-para-eje',
        {},
        'La figura es demasiado pequeña para el eje de edades; aumenta el tamaño o quita el eje.',
      );

    // Márgenes en los extremos para que los números no se salgan de la figura
    let inicio = 0;
    let fin = 0;
    for (let i = 0; i < 3; i++) {
      const largo = largoTotal - inicio - fin;
      if (largo < 1) throw sinEspacio();
      const { etiquetas } = marcasDelEje(tipo, barraDeLargo(largo), unidades, contexto);
      inicio = Math.max(0, ...etiquetas.map((e) => e.extension / 2 - e.pos));
      fin = Math.max(0, ...etiquetas.map((e) => e.pos + e.extension / 2 - largo));
    }
    const largo = largoTotal - inicio - fin;
    if (largo < 1) throw sinEspacio();
    delEje = marcasDelEje(tipo, barraDeLargo(largo), unidades, contexto);
    // Por seguridad, ningún número se sale de la figura
    delEje.etiquetas = delEje.etiquetas.filter(
      (e) => inicio + e.pos - e.extension / 2 >= -1e-6 && inicio + e.pos + e.extension / 2 <= largoTotal + 1e-6,
    );

    anchoNumeros = horizontal
      ? ALTO_TEXTO_EM * tamano
      : Math.max(0, ...delEje.etiquetas.map((e) => medirTexto(e.texto, tamano)));
    const grosorEje =
      LARGO_MARCA_MM + SEPARACION_NUMEROS_MM + anchoNumeros + SEPARACION_TITULO_MM + ALTO_TEXTO_EM * tamano;
    barra = horizontal
      ? { x: inicio, y: 0, ancho: largo, alto: H - grosorEje }
      : { x: 0, y: inicio, ancho: W - grosorEje, alto: largo };
    if (barra.ancho < 1 || barra.alto < 1) throw sinEspacio();
  }

  const geo = calcularLayout(unidades, { ...op, ancho_mm: barra.ancho, alto_mm: barra.alto });
  const desplazamiento = horizontal ? barra.x : barra.y; // a lo largo del tiempo
  // Cada celda lleva también su nombre completo según el idioma y la terminología y, en escala
  // de grises, el gris de su color (el color de la carta queda en color_carta)
  const celdas = geo.celdas.map((c) => ({
    ...c,
    nombre: nombreDeUnidad(c, { idioma, terminologia }),
    color_carta: c.color,
    color: grises ? aGris(c.color) : c.color,
    x: c.x + barra.x,
    y: c.y + barra.y,
  }));
  const limites = geo.limites.map((l) => ({ ...l, pos: l.pos + desplazamiento }));

  let ejeFigura = null;
  if (delEje) {
    const borde = horizontal ? barra.y + barra.alto : barra.x + barra.ancho; // lado de la barra junto al eje
    const marcas = delEje.marcas.map(({ ma, pos }) => {
      const p = pos + desplazamiento;
      return horizontal
        ? { ma, x1: p, y1: borde, x2: p, y2: borde + LARGO_MARCA_MM }
        : { ma, x1: borde, y1: p, x2: borde + LARGO_MARCA_MM, y2: p };
    });
    const inicioNumeros = borde + LARGO_MARCA_MM + SEPARACION_NUMEROS_MM;
    const numeros = delEje.etiquetas.map(({ ma, pos, texto }) => {
      const p = pos + desplazamiento;
      return horizontal
        ? { ma, texto, x: p, y: inicioNumeros + ALTURA_MAYUSCULAS_EM * tamano, ancla: 'middle' }
        : { ma, texto, x: inicioNumeros, y: p + AJUSTE_LINEA_BASE_EM * tamano, ancla: 'start' };
    });
    const textoTitulo = TITULO_DEL_EJE[idioma] ?? TITULO_DEL_EJE.es;
    const inicioTitulo = inicioNumeros + anchoNumeros + SEPARACION_TITULO_MM;
    let titulo;
    if (horizontal) {
      titulo = {
        texto: textoTitulo,
        x: barra.x + barra.ancho / 2,
        y: inicioTitulo + ALTURA_MAYUSCULAS_EM * tamano,
        girada: false,
      };
    } else {
      const cx = inicioTitulo + (ALTO_TEXTO_EM * tamano) / 2;
      const cy = barra.y + barra.alto / 2;
      titulo = { texto: textoTitulo, x: cx, y: cy + AJUSTE_LINEA_BASE_EM * tamano, girada: true, cx, cy };
    }
    ejeFigura = { tipo, solicitado: eje, paso_ma: delEje.paso, marcas, numeros, titulo };
  }

  // Pie: alineado a la izquierda, debajo de la barra y del eje
  const pieFigura = lineasPie
    ? {
        lineas: lineasPie.map((texto, i) => ({
          texto,
          x: 0,
          y: H + SEPARACION_PIE_MM + ALTURA_MAYUSCULAS_EM * tamano + i * INTERLINEA_EM * tamano,
          ancla: 'start',
        })),
      }
    : null;

  return {
    ancho_mm: W,
    alto_mm: op.alto_mm,
    orientacion: op.orientacion,
    escala: op.escala,
    invertir: op.invertir,
    techo_ma: op.techo_ma,
    base_ma: op.base_ma,
    filas: op.rangos,
    tamano_fuente_mm: tamano,
    barra,
    celdas,
    limites,
    etiquetas: etiquetasDeCeldas(celdas, unidades, { tamano_mm: tamano, rotar, idioma, terminologia }),
    eje: ejeFigura,
    pie: pieFigura,
    pie_omitido: Boolean(pie) && !lineasPie,
    idioma,
    grises: Boolean(grises),
  };
}
