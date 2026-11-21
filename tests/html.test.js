// Revisiones de accesibilidad de index.html (sin navegador: se lee como texto).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cuerpo = html.slice(html.indexOf('<body'));
const ids = [...cuerpo.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const conjunto = new Set(ids);

describe('index.html', () => {
  it('no repite ids', () => {
    const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(repetidos).toEqual([]);
  });

  it('cada for, aria-describedby, aria-controls, aria-labelledby y enlace interno apunta a un id que existe', () => {
    const referencias = [
      ...[...cuerpo.matchAll(/\sfor="([^"]+)"/g)].map((m) => m[1]),
      ...[...cuerpo.matchAll(/\saria-(?:describedby|controls|labelledby)="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)),
      ...[...cuerpo.matchAll(/\shref="#([^"]+)"/g)].map((m) => m[1]),
    ];
    expect(referencias.length).toBeGreaterThan(20);
    for (const ref of referencias) expect(conjunto.has(ref), ref).toBe(true);
  });

  it('cada control tiene etiqueta: <label for> o dentro de un <label>', () => {
    const conFor = new Set([...cuerpo.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1]));
    for (const m of cuerpo.matchAll(/<(input|select)\b[^>]*>/g)) {
      const id = /\sid="([^"]+)"/.exec(m[0])?.[1];
      const antes = cuerpo.slice(0, m.index);
      const dentroDeLabel = antes.lastIndexOf('<label') > antes.lastIndexOf('</label>');
      expect(conFor.has(id) || dentroDeLabel, m[0]).toBe(true);
    }
  });

  it('cada botón tiene texto', () => {
    for (const m of cuerpo.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) {
      expect(m[1].trim(), m[0]).not.toBe('');
    }
  });

  it('empieza con un enlace para saltar a la vista previa, que puede recibir el foco', () => {
    expect(cuerpo).toMatch(/^<body>\s*<a class="saltar" href="#vista-previa"/);
    expect(cuerpo).toMatch(/<section id="vista-previa" tabindex="-1"/);
  });

  it('el selector de idioma dice cuál está activo', () => {
    expect(cuerpo).toMatch(/<button type="button" data-idioma="es" lang="es" aria-pressed="true">/);
    expect(cuerpo).toMatch(/<button type="button" data-idioma="en" lang="en" aria-pressed="false">/);
  });

  it('el atributo hidden oculta aunque la clase tenga display (p. ej. .campo)', () => {
    expect(html).toMatch(/\[hidden\]\s*\{\s*display:\s*none\s*!important;?\s*\}/);
  });

  it('no carga nada de internet (los enlaces para el usuario sí pueden ir afuera)', () => {
    expect(html).not.toMatch(/<(script|link|img|iframe|source|video|audio)\b[^>]*\s(src|href)="(https?:)?\/\//);
    expect(html).not.toMatch(/url\(\s*['"]?(https?:)?\/\//);
  });

  it('los enlaces que salen del sitio son https', () => {
    for (const m of cuerpo.matchAll(/<a\b[^>]*\shref="([^"#][^"]*)"/g)) expect(m[1]).toMatch(/^https:\/\//);
  });
});
