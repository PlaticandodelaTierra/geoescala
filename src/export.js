// Exportación de la figura a SVG, PNG y PDF, con su tamaño físico en mm.
//
// Las funciones de la primera parte son puras (texto y bytes) y se prueban con Vitest. Las de
// la segunda parte usan el navegador (canvas, descargas) y se revisan a mano.
//
// - SVG: el mismo de la vista previa, con texto editable y tamaño en mm.
// - PNG: dibujado al tamaño en píxeles que corresponde a los mm y los dpi, con la resolución
//   escrita en el archivo (bloque pHYs) para que Word, PowerPoint o InDesign lo coloquen a su
//   tamaño real. Fondo blanco o transparente.
// - PDF: página del tamaño exacto de la figura, todo vectorial, con Helvetica (fuente estándar
//   de PDF, mismas medidas que Arial). jsPDF y svg2pdf.js se cargan solo al exportar.

import { ErrorGeoEscala } from './errores.js';
import { mmAPx } from './layout.js';

// --- Funciones puras ----------------------------------------------------------------------

// Lado máximo de un canvas que dibujan todos los navegadores de escritorio. Si aun así el
// navegador no puede (p. ej. por memoria), crearPNG() lo detecta y avisa.
export const MAX_LADO_PX = 16384;
export const RESOLUCIONES_PNG = [300, 600];

/** Texto seguro para un nombre de archivo: solo letras, números, punto y guion. */
function limpiar(texto) {
  return String(texto).replace(/[^A-Za-z0-9.-]+/g, '-');
}

/** 'geoescala_66-0Ma_175x30mm.svg' o 'geoescala_66-0Ma_175x30mm_300dpi.png'. */
export function nombreDeArchivo(figura, extension, { dpi } = {}) {
  const intervalo = `${limpiar(figura.base_ma)}-${limpiar(figura.techo_ma)}Ma`;
  const tamano = `${limpiar(figura.ancho_mm)}x${limpiar(figura.alto_mm)}mm`;
  const resolucion = dpi ? `_${dpi}dpi` : '';
  return `geoescala_${intervalo}_${tamano}${resolucion}.${extension}`;
}

/** Documento SVG completo, con la declaración XML. */
export function documentoSVG(svg) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`;
}

/**
 * Tamaño en píxeles de una figura en mm a cierta resolución: 175 mm a 300 dpi → 2067 px.
 * Lanza un error si el navegador no podría dibujarla.
 */
export function tamanoEnPixeles(ancho_mm, alto_mm, dpi) {
  const ancho = Math.round(mmAPx(ancho_mm, dpi));
  const alto = Math.round(mmAPx(alto_mm, dpi));
  if (ancho > MAX_LADO_PX || alto > MAX_LADO_PX) {
    throw new ErrorGeoEscala(
      'png-demasiado-grande',
      { dpi, ancho, alto },
      `A ${dpi} dpi la imagen mediría ${ancho} × ${alto} px, más de lo que el navegador puede dibujar. ` +
        'Usa una resolución menor, o exporta en SVG o PDF, que no tienen ese límite.',
    );
  }
  return { ancho, alto };
}

/**
 * Copia del SVG con width/height en píxeles (el viewBox no cambia), para dibujarlo nítido al
 * tamaño final: algunos navegadores rasterizan el SVG a su tamaño propio y luego lo estiran.
 */
export function svgEnPixeles(svg, ancho_px, alto_px) {
  return svg.replace(
    /^(<svg [^>]*?)width="[^"]*" height="[^"]*"/,
    `$1width="${ancho_px}" height="${alto_px}"`,
  );
}

/** Opciones de jsPDF para una página del tamaño exacto de la figura. */
export function opcionesPDF(figura) {
  return {
    unit: 'mm',
    format: [figura.ancho_mm, figura.alto_mm],
    orientation: figura.ancho_mm > figura.alto_mm ? 'landscape' : 'portrait',
    compress: true,
  };
}

// CRC-32 de los bloques PNG (polinomio 0xEDB88320)
const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const FIRMA_PNG = [137, 80, 78, 71, 13, 10, 26, 10];
const leer32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const escribir32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const tipoDe = (b, i) => String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);

/** Bloques de un PNG: [{ tipo, inicio, fin }] (fin excluido, incluye longitud y CRC). */
function bloquesPNG(bytes) {
  if (!FIRMA_PNG.every((v, i) => bytes[i] === v)) throw new Error('El archivo no es un PNG.');
  const bloques = [];
  for (let i = 8; i < bytes.length; ) {
    const fin = i + 12 + leer32(bytes, i);
    bloques.push({ tipo: tipoDe(bytes, i), inicio: i, fin });
    i = fin;
  }
  return bloques;
}

/**
 * Escribe la resolución en un PNG (bloque pHYs, en píxeles por metro), justo después del
 * encabezado IHDR. Si ya había un pHYs, lo reemplaza.
 */
export function agregarResolucionPNG(bytes, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const tipoYDatos = [...'pHYs'].map((c) => c.charCodeAt(0)).concat(escribir32(ppm), escribir32(ppm), [1]);
  const bloque = [...escribir32(9), ...tipoYDatos, ...escribir32(crc32(tipoYDatos))];

  const partes = [bytes.subarray(0, 8)];
  for (const b of bloquesPNG(bytes)) {
    if (b.tipo === 'pHYs') continue;
    partes.push(bytes.subarray(b.inicio, b.fin));
    if (b.tipo === 'IHDR') partes.push(Uint8Array.from(bloque));
  }
  const salida = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of partes) {
    salida.set(p, i);
    i += p.length;
  }
  return salida;
}

/** Resolución en dpi de un PNG (de su bloque pHYs), o null si no la indica. */
export function leerResolucionPNG(bytes) {
  const b = bloquesPNG(bytes).find((x) => x.tipo === 'pHYs');
  if (!b || bytes[b.inicio + 16] !== 1) return null;
  return Math.round(leer32(bytes, b.inicio + 8) * 0.0254);
}

// --- Navegador ----------------------------------------------------------------------------

/** Descarga un Blob con el nombre dado. */
export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** SVG listo para guardar. */
export function crearSVG(svg) {
  return new Blob([documentoSVG(svg)], { type: 'image/svg+xml;charset=utf-8' });
}

/** Carga un SVG como imagen. */
function cargarImagen(svg) {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolver(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new ErrorGeoEscala('png-no-generado', {}, 'El navegador no pudo leer el SVG para convertirlo en PNG.'));
    };
    img.src = url;
  });
}

/** PNG a la resolución pedida, con fondo blanco o transparente. */
export async function crearPNG(svg, figura, { dpi = 300, transparente = false } = {}) {
  const { ancho, alto } = tamanoEnPixeles(figura.ancho_mm, figura.alto_mm, dpi);
  const img = await cargarImagen(svgEnPixeles(svg, ancho, alto));
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ErrorGeoEscala('png-no-dibujado', { dpi }, 'El navegador no pudo crear una imagen de ese tamaño.');
  if (!transparente) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, ancho, alto);
  }
  ctx.drawImage(img, 0, 0, ancho, alto);

  // Si el navegador no pudo dibujar (memoria), el centro de la primera celda queda vacío
  const c = figura.celdas[0];
  const px = mmAPx(c.x + c.ancho / 2, dpi);
  const py = mmAPx(c.y + c.alto / 2, dpi);
  if (ctx.getImageData(Math.floor(px), Math.floor(py), 1, 1).data[3] === 0) {
    throw new ErrorGeoEscala(
      'png-no-dibujado',
      { dpi },
      'El navegador no pudo dibujar la imagen a esa resolución. Prueba con 300 dpi, o exporta en SVG o PDF.',
    );
  }

  const blob = await new Promise((resolver) => canvas.toBlob(resolver, 'image/png'));
  if (!blob) throw new ErrorGeoEscala('png-no-generado', {}, 'El navegador no pudo generar el PNG.');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return new Blob([agregarResolucionPNG(bytes, dpi)], { type: 'image/png' });
}

/** PDF vectorial del tamaño exacto de la figura. jsPDF y svg2pdf.js se cargan aquí. */
export async function crearPDF(svg, figura) {
  const [{ jsPDF }] = await Promise.all([import('jspdf'), import('svg2pdf.js')]);
  const doc = new jsPDF(opcionesPDF(figura));
  // svg2pdf necesita el SVG en el documento para leer sus estilos; se agrega fuera de la vista
  const contenedor = document.createElement('div');
  contenedor.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden';
  contenedor.innerHTML = svg;
  document.body.append(contenedor);
  try {
    await doc.svg(contenedor.querySelector('svg'), { x: 0, y: 0, width: figura.ancho_mm, height: figura.alto_mm });
  } finally {
    contenedor.remove();
  }
  doc.setProperties({ title: 'Escala de tiempo geológico', creator: 'GeoEscala' });
  return doc.output('blob');
}
