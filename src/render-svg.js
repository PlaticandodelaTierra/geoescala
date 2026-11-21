// Convierte la figura de calcularFigura() (layout.js) en un texto SVG.
//
// La figura se define en milímetros: width="175mm" y 1 unidad del viewBox = 1 mm, así que
// conserva su tamaño físico al abrirla en Inkscape o Illustrator. Todo el texto queda como
// <text> editable; el texto girado usa transform="rotate(-90 …)".
//
// Qué texto va en cada celda, de qué color y si va girado lo decide labels.js.

export const FUENTE = 'Arial, Helvetica, sans-serif';

const TITULO_FIGURA = {
  es: 'Escala de tiempo geológico',
  en: 'Geologic time scale',
};

/** Escapa los caracteres especiales de XML. */
export function escaparXML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Coordenada en mm con 4 decimales como máximo (0.1 µm), sin ceros sobrantes. */
function num(x) {
  const v = Number(x.toFixed(4));
  return String(Object.is(v, -0) ? 0 : v);
}

/** <text> de una etiqueta { texto, x, y, girada, cx, cy, color?, cursiva?, ancla? }. */
function texto(e) {
  const atributos = [`x="${num(e.x)}"`, `y="${num(e.y)}"`];
  if (e.ancla && e.ancla !== 'middle') atributos.push(`text-anchor="${e.ancla}"`);
  if (e.color && e.color !== '#000000') atributos.push(`fill="${escaparXML(e.color)}"`);
  if (e.cursiva) atributos.push('font-style="italic"');
  if (e.girada) atributos.push(`transform="rotate(-90 ${num(e.cx)} ${num(e.cy)})"`);
  return `<text ${atributos.join(' ')}>${escaparXML(e.texto)}</text>`;
}

/**
 * figura: resultado de calcularFigura().
 * opciones: { idioma = 'es', grosor_linea_mm = 0.1, color_linea = '#000000', titulo }
 */
export function renderSVG(figura, opciones = {}) {
  const { idioma = figura.idioma ?? 'es', grosor_linea_mm = 0.1, color_linea = '#000000', titulo } = opciones;
  const { ancho_mm: W, alto_mm: H, barra, celdas, etiquetas, eje } = figura;
  const s = grosor_linea_mm;
  const linea = escaparXML(color_linea);
  const textoTitulo =
    titulo ?? `${TITULO_FIGURA[idioma] ?? TITULO_FIGURA.es}, ${figura.base_ma}–${figura.techo_ma} Ma`;

  const partes = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${num(W)}mm" height="${num(H)}mm" ` +
      `viewBox="0 0 ${num(W)} ${num(H)}" role="img">`,
    `<title>${escaparXML(textoTitulo)}</title>`,
    // Celdas: los bordes quedan centrados en cada límite. El borde exterior de la barra se
    // dibuja aparte, hacia adentro, para que se vea completo sin salirse de la barra.
    // El nombre completo queda en el <title> del rectángulo aunque la etiqueta esté abreviada.
    `<g stroke="${linea}" stroke-width="${num(s)}">`,
    ...celdas.map(
      (c) =>
        `<rect data-id="${escaparXML(c.id)}" x="${num(c.x)}" y="${num(c.y)}" ` +
        `width="${num(c.ancho)}" height="${num(c.alto)}" fill="${escaparXML(c.color)}">` +
        `<title>${escaparXML(c.nombre)}</title></rect>`,
    ),
    `<rect x="${num(barra.x + s / 2)}" y="${num(barra.y + s / 2)}" width="${num(barra.ancho - s)}" ` +
      `height="${num(barra.alto - s)}" fill="none"/>`,
    '</g>',
    `<g font-family="${FUENTE}" font-size="${num(figura.tamano_fuente_mm)}" text-anchor="middle" fill="#000000">`,
    ...etiquetas.map(texto),
    '</g>',
  ];

  if (eje) {
    partes.push(
      `<g class="eje" stroke="${linea}" stroke-width="${num(s)}">`,
      ...eje.marcas.map(
        (m) => `<line x1="${num(m.x1)}" y1="${num(m.y1)}" x2="${num(m.x2)}" y2="${num(m.y2)}"/>`,
      ),
      '</g>',
      `<g font-family="${FUENTE}" font-size="${num(figura.tamano_fuente_mm)}" text-anchor="middle" fill="#000000">`,
      ...eje.numeros.map(texto),
      texto(eje.titulo),
      '</g>',
    );
  }

  // Pie de figura ("Edades y colores: ICS v2026/06")
  if (figura.pie) {
    partes.push(
      `<g class="pie" font-family="${FUENTE}" font-size="${num(figura.tamano_fuente_mm)}" text-anchor="start" fill="#000000">`,
      ...figura.pie.lineas.map((l) => texto({ ...l, ancla: undefined })),
      '</g>',
    );
  }

  partes.push('</svg>');
  return partes.join('\n');
}
