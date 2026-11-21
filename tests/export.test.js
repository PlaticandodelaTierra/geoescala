// Pruebas de la exportación (partes puras de src/export.js).
import { describe, expect, it } from 'vitest';
import datos from '../data/ics-2026-06.json';
import {
  agregarResolucionPNG,
  crc32,
  documentoSVG,
  leerResolucionPNG,
  nombreDeArchivo,
  opcionesPDF,
  svgEnPixeles,
  tamanoEnPixeles,
} from '../src/export.js';
import { calcularFigura } from '../src/layout.js';
import { renderSVG } from '../src/render-svg.js';

const bytesDe = (texto) => [...texto].map((c) => c.charCodeAt(0));
const de32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const bloque = (tipo, datos) => {
  const tipoYDatos = [...bytesDe(tipo), ...datos];
  return [...de32(datos.length), ...tipoYDatos, ...de32(crc32(tipoYDatos))];
};
/** PNG mínimo (sin imagen): firma + IHDR + bloques extra + IEND. */
const pngMinimo = (extra = []) =>
  Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10,
    ...bloque('IHDR', [...de32(2067), ...de32(354), 8, 6, 0, 0, 0]),
    ...extra,
    ...bloque('IEND', []),
  ]);
/** Tipos de los bloques de un PNG, en orden. */
const tiposDe = (bytes) => {
  const tipos = [];
  for (let i = 8; i < bytes.length; ) {
    const largo = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    tipos.push(String.fromCharCode(...bytes.subarray(i + 4, i + 8)));
    i += 12 + largo;
  }
  return tipos;
};

describe('nombres de archivo', () => {
  const figura = { base_ma: 66, techo_ma: 0, ancho_mm: 175, alto_mm: 30 };

  it('llevan el intervalo, el tamaño y, en PNG, la resolución', () => {
    expect(nombreDeArchivo(figura, 'svg')).toBe('geoescala_66-0Ma_175x30mm.svg');
    expect(nombreDeArchivo(figura, 'pdf')).toBe('geoescala_66-0Ma_175x30mm.pdf');
    expect(nombreDeArchivo(figura, 'png', { dpi: 600 })).toBe('geoescala_66-0Ma_175x30mm_600dpi.png');
  });

  it('conservan los decimales tal cual', () => {
    expect(nombreDeArchivo({ base_ma: 23.04, techo_ma: 0.0117, ancho_mm: 90.5, alto_mm: 24 }, 'svg')).toBe(
      'geoescala_23.04-0.0117Ma_90.5x24mm.svg',
    );
  });
});

describe('SVG', () => {
  it('agrega la declaración XML', () => {
    expect(documentoSVG('<svg/>')).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<svg/>\n');
  });

  it('para el PNG, cambia solo el tamaño del <svg> a píxeles y conserva el viewBox en mm', () => {
    const f = calcularFigura(datos.unidades, { base_ma: 66, rangos: ['periodo'], ancho_mm: 175, alto_mm: 30 });
    const svg = renderSVG(f);
    const enPx = svgEnPixeles(svg, 2067, 354);
    expect(enPx).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="2067" height="354" viewBox="0 0 175 30"/);
    // El resto del SVG no cambia
    expect(enPx.slice(enPx.indexOf('>'))).toBe(svg.slice(svg.indexOf('>')));
  });
});

describe('tamaño del PNG en píxeles', () => {
  it.each([
    [175, 30, 300, 2067, 354],
    [175, 30, 600, 4134, 709],
    [85, 20, 600, 2008, 472],
    [25.4, 25.4, 300, 300, 300],
  ])('%s × %s mm a %s dpi → %s × %s px', (ancho, alto, dpi, px, py) => {
    expect(tamanoEnPixeles(ancho, alto, dpi)).toEqual({ ancho: px, alto: py });
  });

  it('avisa si la imagen sería demasiado grande para el navegador', () => {
    expect(() => tamanoEnPixeles(1000, 100, 600)).toThrow(/SVG o PDF/); // 23 622 px de ancho
    expect(() => tamanoEnPixeles(1000, 100, 300)).not.toThrow(); // 11 811 px
  });
});

describe('resolución dentro del PNG (bloque pHYs)', () => {
  it('CRC-32 conocido: el bloque IEND termina en AE 42 60 82', () => {
    expect(crc32(bytesDe('IEND'))).toBe(0xae426082);
  });

  it('se inserta después de IHDR, con su CRC, y se lee de vuelta', () => {
    for (const dpi of [300, 600]) {
      const png = agregarResolucionPNG(pngMinimo(), dpi);
      expect(tiposDe(png)).toEqual(['IHDR', 'pHYs', 'IEND']);
      expect(leerResolucionPNG(png)).toBe(dpi);
      const i = 33; // 8 de firma + 25 de IHDR
      const ppm = Math.round(dpi / 0.0254); // 300 dpi → 11 811 píxeles por metro
      expect([...png.subarray(i, i + 8)]).toEqual([0, 0, 0, 9, ...bytesDe('pHYs')]);
      expect([...png.subarray(i + 8, i + 17)]).toEqual([...de32(ppm), ...de32(ppm), 1]);
      expect([...png.subarray(i + 17, i + 21)]).toEqual(de32(crc32(png.subarray(i + 4, i + 17))));
    }
  });

  it('reemplaza un pHYs que ya existía, sin duplicarlo', () => {
    const conPhys = pngMinimo(bloque('pHYs', [...de32(2835), ...de32(2835), 1])); // 72 dpi
    expect(leerResolucionPNG(conPhys)).toBe(72);
    const png = agregarResolucionPNG(conPhys, 600);
    expect(tiposDe(png)).toEqual(['IHDR', 'pHYs', 'IEND']);
    expect(leerResolucionPNG(png)).toBe(600);
  });

  it('un PNG sin pHYs no indica resolución; un archivo que no es PNG se rechaza', () => {
    expect(leerResolucionPNG(pngMinimo())).toBeNull();
    expect(() => agregarResolucionPNG(Uint8Array.from([1, 2, 3]), 300)).toThrow(/no es un PNG/);
  });
});

describe('PDF', () => {
  it('una página del tamaño exacto de la figura, en mm', () => {
    expect(opcionesPDF({ ancho_mm: 175, alto_mm: 30 })).toEqual({
      unit: 'mm',
      format: [175, 30],
      orientation: 'landscape',
      compress: true,
    });
    expect(opcionesPDF({ ancho_mm: 30, alto_mm: 175 }).orientation).toBe('portrait');
  });
});
