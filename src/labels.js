// Etiquetas: qué texto va en cada celda y en el eje, y de qué color (funciones puras, sin DOM).
//
// - Medición del texto con los anchos de Helvetica/Arial.
// - Nombres según la terminología (cronoestratigráfica o geocronológica) y el idioma.
// - Abreviaturas: las de los datos si existen y no se repiten; si no, automáticas.
// - Ajuste en la celda: completo → completo girado → abreviatura → abreviatura girada → oculto.
// - Color del texto (negro o blanco) según el contraste con el fondo (WCAG).
// - Texto de las edades de los límites y selección de las que no se enciman.

const sinAcentos = (texto) => String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '');

// --- Medición -----------------------------------------------------------------------------

// Anchos de los caracteres de Helvetica (métricas AFM de Adobe, en milésimas del tamaño de la
// fuente). Arial tiene los mismos anchos y la cursiva también.
const ANCHOS_POR_GRUPO = [
  [191, "'"],
  [222, 'ijl'],
  [260, '|'],
  [278, ' !,./:;I[\\]ft·'],
  [333, '()-`r'],
  [334, '{}'],
  [355, '"'],
  [389, '*'],
  [469, '^'],
  [500, 'Jcksvxyz'],
  [556, '#$0123456789?L_abdeghnopqu–'],
  [584, '+<=>~±'],
  [611, 'FTZ'],
  [667, '&ABEKPSVXY'],
  [722, 'CDHNRUw'],
  [778, 'GOQ'],
  [833, 'Mm'],
  [889, '%'],
  [944, 'W'],
  [1000, '—'],
  [1015, '@'],
];
const ANCHOS = new Map(ANCHOS_POR_GRUPO.flatMap(([ancho, letras]) => [...letras].map((c) => [c, ancho])));
const ANCHO_POR_DEFECTO = 556;

/** Ancho del texto en mm, para un tamaño de fuente en mm. Las letras acentuadas miden como la letra sin acento. */
export function medirTexto(texto, tamanoMm) {
  let milesimas = 0;
  for (const c of sinAcentos(texto)) milesimas += ANCHOS.get(c) ?? ANCHO_POR_DEFECTO;
  return (milesimas / 1000) * tamanoMm;
}

// Alto que ocupa una línea de texto, en fracciones del tamaño de la fuente
export const ALTO_TEXTO_EM = 1;
// Margen mínimo entre el texto y el borde de la celda
export const MARGEN_EM = 0.2;
// Altura de las mayúsculas y los números de Arial
export const ALTURA_MAYUSCULAS_EM = 0.72;
// Distancia del centro a la línea base para que el texto se vea centrado (≈ mitad de la altura
// de las mayúsculas)
export const AJUSTE_LINEA_BASE_EM = 0.35;

// --- Terminología -------------------------------------------------------------------------

export const TERMINOLOGIAS = ['cronoestratigrafica', 'geocronologica'];

// Nombres de los rangos según la terminología, en el orden eon, era, periodo, epoca, edad
const NOMBRES_DE_RANGO = {
  cronoestratigrafica: {
    es: ['Eonotema', 'Eratema', 'Sistema', 'Serie', 'Piso'],
    en: ['Eonothem', 'Erathem', 'System', 'Series', 'Stage'],
  },
  geocronologica: {
    es: ['Eón', 'Era', 'Periodo', 'Época', 'Edad'],
    en: ['Eon', 'Era', 'Period', 'Epoch', 'Age'],
  },
};
const ORDEN_RANGOS = ['eon', 'era', 'periodo', 'epoca', 'edad'];

/** 'epoca' → 'Serie' (cronoestratigráfica) o 'Época' (geocronológica). */
export function nombreDeRango(rango, { idioma = 'es', terminologia = 'cronoestratigrafica' } = {}) {
  const nombres = NOMBRES_DE_RANGO[terminologia]?.[idioma] ?? NOMBRES_DE_RANGO.cronoestratigrafica.es;
  return nombres[ORDEN_RANGOS.indexOf(rango)];
}

// Equivalencias de la carta ICS: Inferior/Superior ↔ Temprano/Tardío, Serie/Piso ↔ Época/Edad
const A_GEOCRONOLOGICA = {
  es: [
    [/\bInferior\b/, 'Temprano'],
    [/\bSuperior\b/, 'Tardío'],
    [/^Serie (\d+)$/, 'Época $1'],
    [/^Piso (\d+)$/, 'Edad $1'],
  ],
  en: [
    [/^Lower\b/, 'Early'],
    [/^Upper\b/, 'Late'],
    [/^Series (\d+)$/, 'Epoch $1'],
    [/^Stage (\d+)$/, 'Age $1'],
  ],
};

/** Nombre de la unidad en el idioma y la terminología pedidos ('Cretácico Superior' → 'Cretácico Tardío'). */
export function nombreDeUnidad(u, { idioma = 'es', terminologia = 'cronoestratigrafica' } = {}) {
  const nombre = idioma === 'en' ? u.nombre_en : u.nombre_es;
  if (terminologia !== 'geocronologica') return nombre;
  return A_GEOCRONOLOGICA[idioma === 'en' ? 'en' : 'es'].reduce((n, [patron, cambio]) => n.replace(patron, cambio), nombre);
}

/** Todos los nombres con que se puede buscar una unidad (los dos idiomas y las dos terminologías). */
export function nombresDeBusqueda(u) {
  const nombres = [];
  for (const idioma of ['es', 'en']) {
    for (const terminologia of TERMINOLOGIAS) nombres.push(nombreDeUnidad(u, { idioma, terminologia }));
  }
  return [...new Set(nombres)];
}

// --- Abreviaturas -------------------------------------------------------------------------

const VOCALES = new Set('aeiou');
const esVocal = (c) => VOCALES.has(sinAcentos(c).toLowerCase());
// Las abreviaturas automáticas recortan cada palabra a entre 3 y 7 letras
const LETRAS_MIN = 3;
const LETRAS_MAX = 7;

/** Recortes de una palabra, del más largo al más corto: 'Burdigaliano' → ['Burdig.', 'Burd.', 'Bur.']. */
function recortesDePalabra(palabra) {
  const letras = [...palabra];
  if (letras.length <= LETRAS_MIN + 1 || /\d/.test(palabra)) return [palabra];
  const recortes = [];
  for (let k = Math.min(LETRAS_MAX, letras.length - 2); k >= LETRAS_MIN; k--) {
    // Se corta después de una consonante ('Burdig.', no 'Burdiga.'), salvo en el recorte mínimo
    if (!esVocal(letras[k - 1]) || k === LETRAS_MIN) recortes.push(`${letras.slice(0, k).join('')}.`);
  }
  return recortes;
}

/**
 * Abreviaturas automáticas de un nombre, de la más larga a la más corta. Cada palabra se recorta
 * al mismo nivel: 'Cretácico Superior' → ['Cretác. Super.', 'Cret. Sup.', 'Cre. Sup.'].
 */
export function abreviaturasAutomaticas(nombre) {
  const palabras = nombre.split(' ').map(recortesDePalabra);
  const niveles = Math.max(...palabras.map((r) => r.length));
  const resultado = [];
  for (let n = 0; n < niveles; n++) {
    const texto = palabras.map((r) => r[Math.min(n, r.length - 1)]).join(' ');
    if (texto !== nombre && !resultado.includes(texto)) resultado.push(texto);
  }
  return resultado;
}

/** Abreviaturas de los datos que comparten dos o más unidades (p. ej. 'St': Steniano y Statheriano). */
export function abreviaturasRepetidas(unidades) {
  const cuenta = new Map();
  for (const u of unidades) if (u.abrev) cuenta.set(u.abrev, (cuenta.get(u.abrev) ?? 0) + 1);
  return new Set([...cuenta].filter(([, n]) => n > 1).map(([a]) => a));
}

/** Abreviaturas de una unidad: la de los datos si existe y no se repite; si no, las automáticas. */
export function abreviaturasDe(u, nombre, repetidas = new Set()) {
  if (u.abrev && !repetidas.has(u.abrev)) return [u.abrev];
  return abreviaturasAutomaticas(nombre);
}

// --- Color del texto ----------------------------------------------------------------------

/** Luminancia relativa de un color '#RRGGBB' (WCAG 2). */
export function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste entre dos colores (de 1 a 21). */
export function contraste(hexA, hexB) {
  const [a, b] = [luminancia(hexA), luminancia(hexB)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Negro o blanco, el que contraste más con el fondo (en empate, negro). */
export function colorDeTexto(fondo) {
  return contraste(fondo, '#000000') >= contraste(fondo, '#FFFFFF') ? '#000000' : '#FFFFFF';
}

/**
 * Gris con la misma luminancia relativa que el color (como lo vería una impresión en blanco y
 * negro): '#FFFF00' → '#F7F7F7'. Así el contraste y el color del texto no cambian.
 */
export function aGris(hex) {
  const y = luminancia(hex);
  const srgb = y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055;
  const v = Math.round(Math.min(1, Math.max(0, srgb)) * 255)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
  return `#${v}${v}${v}`;
}

// --- Ajuste en la celda -------------------------------------------------------------------

/**
 * Elige el primer texto que cabe en la celda, en este orden: completo, completo girado,
 * abreviaturas (de la más larga a la más corta), abreviaturas giradas. Regresa
 * { texto, girada } o null si nada cabe.
 */
export function elegirTexto(celda, textos, { tamano_mm, rotar = true }) {
  const margen = MARGEN_EM * tamano_mm;
  const ancho = celda.ancho - 2 * margen;
  const alto = celda.alto - 2 * margen;
  const altoTexto = ALTO_TEXTO_EM * tamano_mm;
  const cabe = (texto, girada) => {
    const largo = medirTexto(texto, tamano_mm);
    return girada ? largo <= alto && altoTexto <= ancho : largo <= ancho && altoTexto <= alto;
  };

  const [completo, ...abreviaturas] = textos;
  const intentos = [[completo, false]];
  if (rotar) intentos.push([completo, true]);
  for (const a of abreviaturas) intentos.push([a, false]);
  if (rotar) for (const a of abreviaturas) intentos.push([a, true]);

  for (const [texto, girada] of intentos) if (cabe(texto, girada)) return { texto, girada };
  return null;
}

/**
 * Etiquetas de todas las celdas. Cada una: { id, texto, x, y, girada, cx, cy, color, cursiva }.
 * (x, y) es el punto de la línea base del texto sin girar; si va girada, se gira −90° sobre el
 * centro de la celda (cx, cy).
 */
export function etiquetasDeCeldas(celdas, unidades, { tamano_mm, rotar = true, idioma = 'es', terminologia } = {}) {
  const repetidas = abreviaturasRepetidas(unidades);
  const etiquetas = [];
  for (const c of celdas) {
    const nombre = nombreDeUnidad(c, { idioma, terminologia });
    const elegido = elegirTexto(c, [nombre, ...abreviaturasDe(c, nombre, repetidas)], { tamano_mm, rotar });
    if (!elegido) continue;
    const cx = c.x + c.ancho / 2;
    const cy = c.y + c.alto / 2;
    etiquetas.push({
      id: c.id,
      texto: elegido.texto,
      x: cx,
      y: cy + AJUSTE_LINEA_BASE_EM * tamano_mm,
      girada: elegido.girada,
      cx,
      cy,
      color: colorDeTexto(c.color),
      cursiva: c.informal === true,
    });
  }
  return etiquetas;
}

// --- Edades del eje -----------------------------------------------------------------------

/**
 * Texto de un límite con la notación de la carta ('66.00', '3.600'). Con `incertidumbre`,
 * agrega '~' y '± x' si la carta los da. Si ninguna unidad tiene esa base (p. ej. un intervalo
 * recortado en 10 Ma, o el presente), escribe el número tal cual.
 */
export function textoDeLimite(ma, unidades, { incertidumbre = false } = {}) {
  const u = unidades.find((x) => x.base_ma === ma);
  if (!u) return String(ma);
  let texto = u.base_texto ?? String(ma);
  if (incertidumbre) {
    if (u.aproximada) texto = `~${texto}`;
    if (u.incertidumbre_ma !== null) texto = `${texto} ± ${u.incertidumbre_texto ?? u.incertidumbre_ma}`;
  }
  return texto;
}

/**
 * Elige las etiquetas del eje que no se enciman. candidatas: [{ pos, extension, prioridad }]
 * (extension = lo que ocupa a lo largo del eje). Se aceptan por prioridad (menor primero) y,
 * con la misma prioridad, en orden de posición. Regresa las aceptadas, ordenadas por posición.
 */
export function elegirSinChoques(candidatas, separacion = 0) {
  const orden = [...candidatas].sort((a, b) => a.prioridad - b.prioridad || a.pos - b.pos);
  const aceptadas = [];
  for (const c of orden) {
    const ini = c.pos - c.extension / 2 - separacion / 2;
    const fin = c.pos + c.extension / 2 + separacion / 2;
    const choca = aceptadas.some((a) => {
      const aIni = a.pos - a.extension / 2 - separacion / 2;
      const aFin = a.pos + a.extension / 2 + separacion / 2;
      return ini < aFin && aIni < fin;
    });
    if (!choca) aceptadas.push(c);
  }
  return aceptadas.sort((a, b) => a.pos - b.pos);
}

// --- Pie de figura ------------------------------------------------------------------------

const PIE = {
  es: (version) => `Edades y colores: ICS v${version}`,
  en: (version) => `Ages and colors: ICS v${version}`,
};

/** 'Edades y colores: ICS v2026/06'. */
export function textoDelPie(version, idioma = 'es') {
  return (PIE[idioma] ?? PIE.es)(version);
}

/**
 * Líneas del pie para un ancho dado: una si cabe; si no, dos (se corta después de ': ', o en
 * el espacio más cercano a la mitad). Regresa null si ni en dos líneas cabe.
 */
export function lineasDelPie(texto, ancho_mm, tamano_mm) {
  const cabe = (t) => medirTexto(t, tamano_mm) <= ancho_mm;
  if (cabe(texto)) return [texto];
  let corte = texto.indexOf(': ');
  if (corte >= 0) {
    corte += 1;
  } else {
    const espacios = [...texto.matchAll(/ /g)].map((m) => m.index);
    if (espacios.length === 0) return null;
    corte = espacios.reduce((a, b) => (Math.abs(b - texto.length / 2) < Math.abs(a - texto.length / 2) ? b : a));
  }
  const lineas = [texto.slice(0, corte).trim(), texto.slice(corte).trim()];
  return lineas.every(cabe) ? lineas : null;
}
