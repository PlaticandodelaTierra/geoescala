// Pruebas del SVG generado (src/render-svg.js).
import { describe, expect, it } from 'vitest';
import datos from '../data/ics-2026-06.json';
import { calcularFigura } from '../src/layout.js';
import { escaparXML, renderSVG } from '../src/render-svg.js';

const unidades = datos.unidades;
const figura = (op = {}) =>
  calcularFigura(unidades, { base_ma: 66, rangos: ['periodo', 'epoca', 'edad'], ancho_mm: 175, alto_mm: 30, ...op });
const contar = (texto, patron) => (texto.match(patron) ?? []).length;

describe('renderSVG', () => {
  const cenozoico = figura();
  const svg = renderSVG(cenozoico);

  it('declara el tamaño físico en mm y un viewBox en mm', () => {
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="175mm" height="30mm" viewBox="0 0 175 30"/);
    expect(svg.trim().endsWith('</svg>')).toBe(true);
  });

  it('dibuja un rectángulo por celda, con el color de la carta, más el borde exterior de la barra', () => {
    expect(contar(svg, /<rect data-id=/g)).toBe(cenozoico.celdas.length);
    expect(contar(svg, /<rect /g)).toBe(cenozoico.celdas.length + 1);
    const neogeno = unidades.find((u) => u.id === 'periodo-neogeno');
    expect(svg).toMatch(new RegExp(`data-id="periodo-neogeno"[^>]*fill="${neogeno.color}"`));
  });

  it('el borde exterior queda dentro de la barra', () => {
    const { barra } = cenozoico;
    const borde = svg.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="none"\/>/);
    expect(Number(borde[1])).toBeCloseTo(barra.x + 0.05, 4);
    expect(Number(borde[3])).toBeCloseTo(barra.ancho - 0.1, 4);
    expect(Number(borde[4])).toBeCloseTo(barra.alto - 0.1, 4);
  });

  it('las etiquetas usan Arial con el tamaño en pt convertido a mm', () => {
    expect(svg).toContain('font-family="Arial, Helvetica, sans-serif" font-size="2.4694"');
    expect(renderSVG(figura({ tamano_fuente_pt: 6 }))).toContain('font-size="2.1167"');
  });

  it('escribe las etiquetas que eligió labels.js y el nombre completo en el <title>', () => {
    expect(contar(svg, /<text /g)).toBe(cenozoico.etiquetas.length + cenozoico.eje.numeros.length + 1);
    expect(svg).toMatch(/<text [^>]*>Neógeno<\/text>/);
    expect(svg).not.toMatch(/<text [^>]*>Megalayiano<\/text>/);
    expect(svg).toContain('<title>Megalayiano</title>');
  });

  it('gira el texto con transform="rotate(-90 …)" sobre el centro de la celda', () => {
    const girada = cenozoico.etiquetas.find((e) => e.girada);
    expect(girada).toBeDefined();
    const cx = Number(girada.cx.toFixed(4));
    const cy = Number(girada.cy.toFixed(4));
    expect(svg).toContain(`transform="rotate(-90 ${cx} ${cy})">${girada.texto}</text>`);
  });

  it('escribe en blanco sobre los fondos oscuros', () => {
    const s = renderSVG(figura({ base_ma: 4567, rangos: ['eon', 'era', 'periodo', 'epoca', 'edad'], alto_mm: 40 }));
    expect(s).toMatch(/<text [^>]*fill="#FFFFFF"[^>]*>Hadeano<\/text>/);
    expect(s).toMatch(/<text [^>]*>Fanerozoico<\/text>/);
    expect(s).not.toMatch(/<text [^>]*fill="#FFFFFF"[^>]*>Fanerozoico<\/text>/);
  });

  it('escribe las unidades informales en cursivas, con cualquier terminología', () => {
    const op = { techo_ma: 506.5, base_ma: 538.8, rangos: ['epoca', 'edad'], escala: 'uniforme', alto_mm: 20 };
    const s = renderSVG(figura(op));
    expect(s).toMatch(/<text [^>]*font-style="italic"[^>]*>Piso 2<\/text>/);
    expect(s).toMatch(/<text [^>]*font-style="italic"[^>]*>Serie 2<\/text>/);
    expect(s).not.toMatch(/<text [^>]*font-style="italic"[^>]*>Fortuniano<\/text>/);
    const g = renderSVG(figura({ ...op, terminologia: 'geocronologica' }));
    expect(g).toMatch(/<text [^>]*font-style="italic"[^>]*>Edad 2<\/text>/);
    expect(g).toMatch(/<text [^>]*font-style="italic"[^>]*>Época 2<\/text>/);
  });

  it('dibuja el eje: una línea por marca, los números y el título', () => {
    expect(contar(svg, /<line /g)).toBe(cenozoico.eje.marcas.length);
    for (const n of ['0', '10', '20', '30', '40', '50', '60']) expect(svg).toMatch(new RegExp(`<text [^>]*>${n}</text>`));
    expect(svg).toMatch(/<text [^>]*>Edad \(Ma\)<\/text>/);
    const sinEje = renderSVG(figura({ eje: 'ninguno' }));
    expect(sinEje).not.toContain('<line ');
    expect(sinEje).not.toContain('Edad (Ma)');
  });

  it('en vertical, los números van alineados a la izquierda y el título girado', () => {
    const s = renderSVG(figura({ orientacion: 'vertical', ancho_mm: 30, alto_mm: 175 }));
    expect(s).toMatch(/<text [^>]*text-anchor="start"[^>]*>10<\/text>/);
    expect(s).toMatch(/<text [^>]*transform="rotate\(-90 [^"]+\)">Edad \(Ma\)<\/text>/);
  });

  it('dibuja el pie de figura alineado a la izquierda', () => {
    const s = renderSVG(figura({ pie: 'Edades y colores: ICS v2026/06' }));
    expect(s).toMatch(/<g class="pie" [^>]*text-anchor="start"[^>]*>\n<text x="0" y="[\d.]+">Edades y colores: ICS v2026\/06<\/text>/);
    expect(svg).not.toContain('class="pie"');
  });

  it('en inglés', () => {
    const en = renderSVG(figura({ idioma: 'en' }), { idioma: 'en' });
    expect(en).toMatch(/<text [^>]*>Neogene<\/text>/);
    expect(en).not.toContain('Neógeno');
    expect(en).toContain('<title>Geologic time scale, 66–0 Ma</title>');
    expect(en).toMatch(/<text [^>]*>Age \(Ma\)<\/text>/);
  });

  it('escapa los caracteres especiales de los nombres', () => {
    const falsas = [
      { id: 'x', rango: 'eon', nombre_es: 'A & B <C> "D"', nombre_en: 'E', color: '#FFFFFF', base_ma: 10, techo_ma: 0 },
    ];
    const f = calcularFigura(falsas, { base_ma: 10, rangos: ['eon'], ancho_mm: 100, alto_mm: 15 });
    const s = renderSVG(f);
    expect(s).toContain('A &amp; B &lt;C&gt; &quot;D&quot;');
    expect(s).not.toContain('<C>');
  });
});

describe('escaparXML', () => {
  it('escapa &, <, >, comillas y apóstrofos', () => {
    expect(escaparXML(`a & b < c > d " e ' f`)).toBe('a &amp; b &lt; c &gt; d &quot; e &apos; f');
  });
});

describe('renderSVG en escala de grises', () => {
  it('todas las celdas son grises', () => {
    const s = renderSVG(figura({ grises: true }));
    const rellenos = [...s.matchAll(/<rect data-id="[^"]+"[^>]*fill="(#[0-9A-F]{6})"/g)].map((m) => m[1]);
    expect(rellenos.length).toBeGreaterThan(10);
    for (const r of rellenos) expect(r).toMatch(/^#([0-9A-F]{2})\1\1$/);
  });

  it('el título del SVG sigue el idioma de la figura', () => {
    expect(renderSVG(figura({ idioma: 'en' }))).toContain('<title>Geologic time scale, 66–0 Ma</title>');
  });
});
