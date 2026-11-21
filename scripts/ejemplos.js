// Genera las figuras de ejemplo del README (docs/ejemplos/*.svg) con las mismas funciones de la
// app, así que muestran exactamente lo que exporta GeoEscala.
//
// Uso:  node scripts/ejemplos.js
// tests/publicacion.test.js revisa que los archivos estén al día con el código.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { documentoSVG } from '../src/export.js';
import { calcularFigura } from '../src/layout.js';
import { renderSVG } from '../src/render-svg.js';
import { ESTADO_POR_DEFECTO, opcionesDeFigura } from '../src/state.js';

const CARPETA = fileURLToPath(new URL('../docs/ejemplos/', import.meta.url));

// Cada ejemplo es un estado de la app, como el que guarda la URL
export const EJEMPLOS = [
  {
    archivo: 'cenozoico.svg',
    descripcion: 'Cenozoico, periodos, épocas y edades, 175 × 30 mm, en español',
    estado: { base_ma: 66, rangos: ['periodo', 'epoca', 'edad'], ancho_mm: 175, alto_mm: 30 },
  },
  {
    archivo: 'phanerozoic.svg',
    descripcion: 'Phanerozoic, eons to periods, 175 × 30 mm, in English',
    estado: {
      base_ma: 538.8,
      rangos: ['eon', 'era', 'periodo'],
      ancho_mm: 175,
      alto_mm: 30,
      idioma: 'en',
      eje: 'intervalo',
      eje_paso_ma: 100,
    },
  },
  {
    archivo: 'mesozoico-vertical.svg',
    descripcion: 'Mesozoico vertical, escala uniforme, edades de los límites con ~ y ±, 60 × 160 mm',
    estado: {
      techo_ma: 66,
      base_ma: 251.902,
      rangos: ['periodo', 'epoca'],
      orientacion: 'vertical',
      escala: 'uniforme',
      ancho_mm: 60,
      alto_mm: 160,
      eje: 'limites',
      incertidumbre: true,
      terminologia: 'geocronologica',
    },
  },
];

/** [{ archivo, svg }] de cada ejemplo, a partir de los datos de la carta. */
export function crearEjemplos(datos) {
  return EJEMPLOS.map(({ archivo, estado }) => {
    const e = { ...ESTADO_POR_DEFECTO, ...estado };
    const figura = calcularFigura(datos.unidades, opcionesDeFigura(e, datos.unidades, { version: datos.version }));
    return { archivo, svg: documentoSVG(renderSVG(figura)) };
  });
}

async function main() {
  const datos = JSON.parse(await readFile(new URL('../data/ics-2026-06.json', import.meta.url), 'utf8'));
  await mkdir(CARPETA, { recursive: true });
  for (const { archivo, svg } of crearEjemplos(datos)) {
    await writeFile(new URL(archivo, `file://${CARPETA}`), svg, 'utf8');
    console.log(`Escrito docs/ejemplos/${archivo}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
