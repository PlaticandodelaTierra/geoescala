// Pruebas de los archivos de publicación: CITATION.cff, LICENSE, README, workflow y ejemplos.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import datos from '../data/ics-2026-06.json';
import paquete from '../package.json';
import { crearEjemplos, EJEMPLOS } from '../scripts/ejemplos.js';
import { ANIO, AUTOR, AUTOR_CITA, URL_APP, URL_REPOSITORIO, VERSION } from '../src/acerca.js';
import { DOI_CARTA, textoDeCita } from '../src/cita.js';

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8');
const existe = (ruta) => existsSync(new URL(`../${ruta}`, import.meta.url));

describe('versión, autor y direcciones coinciden en todos lados', () => {
  const cff = leer('CITATION.cff');

  it('la versión de package.json, CITATION.cff y la app es la misma', () => {
    expect(VERSION).toBe(paquete.version);
    expect(cff).toMatch(new RegExp(`^version: ${VERSION.replace(/\./g, '\\.')}$`, 'm'));
  });

  it('el autor es el mismo en CITATION.cff, LICENSE, package.json y la cita', () => {
    expect(AUTOR).toBe('Darío Torres Sánchez');
    expect(cff).toMatch(/authors:\n {2}- given-names: Darío\n {4}family-names: Torres Sánchez\n/);
    expect(leer('LICENSE')).toContain(`Copyright (c) ${ANIO} ${AUTOR}`);
    expect(paquete.author).toBe(AUTOR);
    expect(AUTOR_CITA).toBe('Torres Sánchez, D.');
  });

  it('las direcciones del repositorio y de la app coinciden', () => {
    expect(cff).toContain(`repository-code: "${URL_REPOSITORIO}"`);
    expect(cff).toContain(`url: "${URL_APP}"`);
    expect(paquete.homepage).toBe(URL_APP);
    expect(paquete.repository.url).toBe(`git+${URL_REPOSITORIO}.git`);
  });

  it('CITATION.cff cita la carta ICS con su DOI y es formato 1.2.0', () => {
    expect(cff).toMatch(/^cff-version: 1\.2\.0$/m);
    expect(cff).toMatch(/^type: software$/m);
    expect(cff).toMatch(/^license: MIT$/m);
    expect(`https://doi.org/${/doi: (\S+)/.exec(cff)[1]}`).toBe(DOI_CARTA);
    // Sin tabuladores (YAML no los acepta para sangrar)
    expect(cff).not.toContain('\t');
  });

  it('la cita de la app nombra a GeoEscala con versión, autor, año y dirección', () => {
    for (const idioma of ['es', 'en']) {
      const texto = textoDeCita({ version: datos.version, idioma, fecha: new Date(2026, 10, 18) });
      expect(texto).toContain(`GeoEscala v${VERSION} (${AUTOR_CITA}, ${ANIO}), ${URL_APP}`);
    }
  });
});

describe('licencia', () => {
  it('LICENSE es la licencia MIT completa', () => {
    const licencia = leer('LICENSE');
    expect(licencia).toMatch(/^MIT License\n/);
    expect(licencia).toContain('Permission is hereby granted, free of charge');
    expect(licencia).toContain('THE SOFTWARE IS PROVIDED "AS IS"');
  });
});

describe('README en inglés y en español', () => {
  const readmes = { 'README.md': leer('README.md'), 'README.es.md': leer('README.es.md') };

  it.each(Object.keys(readmes))('%s: cada enlace o imagen local apunta a un archivo que existe', (nombre) => {
    const texto = readmes[nombre].replace(/<!--[\s\S]*?-->/g, ''); // sin los comentarios
    const rutas = [
      ...[...texto.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
      ...[...texto.matchAll(/\ssrc="([^"]+)"/g)].map((m) => m[1]),
    ].filter((r) => !/^(https?:|mailto:|#)/.test(r));
    expect(rutas.length).toBeGreaterThan(5);
    for (const ruta of rutas) expect(existe(ruta), ruta).toBe(true);
  });

  it.each(Object.keys(readmes))('%s: tiene lo que pide CLAUDE.md', (nombre) => {
    const texto = readmes[nombre];
    expect(texto).toContain(`(${URL_APP})`); // botón para abrir la app
    for (const e of EJEMPLOS) expect(texto).toContain(`docs/ejemplos/${e.archivo}`);
    expect(texto).toContain('docs/geoescala.gif'); // lugar del GIF
    expect(texto).toContain('CITATION.cff');
    expect(texto).toContain(DOI_CARTA);
    expect(texto).toContain('deeptime');
    expect(texto).toContain('B.I.R.D.S');
    expect(texto).toContain('CC BY 4.0');
  });

  it('cada README enlaza al otro idioma', () => {
    expect(readmes['README.md']).toContain('[Español](README.es.md)');
    expect(readmes['README.es.md']).toContain('[English](README.md)');
  });
});

describe('workflow de GitHub Pages', () => {
  const wf = leer('.github/workflows/deploy.yml');

  it('se ejecuta en cada push a main y a mano', () => {
    expect(wf).toMatch(/push:\n\s+branches: \[main\]/);
    expect(wf).toContain('workflow_dispatch:');
  });

  it('instala, corre las pruebas y después compila: si una prueba falla no se publica', () => {
    const [ci, prueba, compila] = ['run: npm ci', 'run: npm test', 'run: npm run build'].map((s) => wf.indexOf(s));
    expect(ci).toBeGreaterThan(0);
    expect(prueba).toBeGreaterThan(ci);
    expect(compila).toBeGreaterThan(prueba);
  });

  it('la ruta del sitio sale del nombre del repositorio y se publica dist/', () => {
    expect(wf).toContain('npm run build -- --base "/${{ github.event.repository.name }}/"');
    expect(wf).toMatch(/upload-pages-artifact@v\d+\n\s+with:\n\s+path: dist/);
    expect(wf).toMatch(/deploy-pages@v\d+/);
    expect(wf).toMatch(/pages: write/);
    expect(wf).toMatch(/id-token: write/);
  });

  it('usa la versión de Node de .nvmrc', () => {
    expect(wf).toContain('node-version-file: .nvmrc');
    expect(leer('.nvmrc')).toMatch(/^\d+\n$/);
  });
});

describe('figuras de ejemplo', () => {
  it('docs/ejemplos/ está al día con el código (si falla: node scripts/ejemplos.js)', () => {
    for (const { archivo, svg } of crearEjemplos(datos)) {
      expect(leer(`docs/ejemplos/${archivo}`), archivo).toBe(svg);
    }
  });
});
