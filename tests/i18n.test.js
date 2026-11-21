// Pruebas de los textos de la interfaz (src/i18n.js).
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { crearIdioma, IDIOMAS, idiomaGuardado, mensajeDeError, t, TEXTOS } from '../src/i18n.js';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');
const variables = (texto) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('diccionarios', () => {
  it('español e inglés tienen las mismas claves, sin textos vacíos', () => {
    expect(Object.keys(TEXTOS.en).sort()).toEqual(Object.keys(TEXTOS.es).sort());
    for (const idioma of IDIOMAS) {
      for (const [clave, texto] of Object.entries(TEXTOS[idioma])) expect(texto.trim(), `${idioma}: ${clave}`).not.toBe('');
    }
  });

  it('cada texto usa los mismos datos en los dos idiomas', () => {
    for (const clave of Object.keys(TEXTOS.es)) {
      expect(variables(TEXTOS.en[clave]), clave).toEqual(variables(TEXTOS.es[clave]));
    }
  });

  it('cada clave de index.html existe', () => {
    const html = leer('../index.html');
    const claves = [
      ...[...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]),
      ...[...html.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap((m) => m[1].split(';').map((p) => p.split(':')[1].trim())),
    ];
    expect(claves.length).toBeGreaterThan(50);
    for (const clave of claves) expect(clave in TEXTOS.es, clave).toBe(true);
  });

  it('cada código de error del código fuente tiene su texto', () => {
    const fuentes = ['state.js', 'layout.js', 'eje.js', 'export.js'].map((f) => leer(`../src/${f}`)).join('\n');
    const codigos = new Set([
      ...[...fuentes.matchAll(/new ErrorGeoEscala\(\s*'([a-z-]+)'/g)].map((m) => m[1]),
      ...[...fuentes.matchAll(/\berror\(\s*[\w']+,\s*'([a-z-]+)'/g)].map((m) => m[1]),
    ]);
    expect(codigos.size).toBeGreaterThanOrEqual(15);
    for (const c of codigos) expect(`error.${c}` in TEXTOS.es, c).toBe(true);
  });
});

describe('t y mensajeDeError', () => {
  it('llena los datos', () => {
    expect(t('es', 'exportar.listo', { nombre: 'a.svg' })).toBe('Listo: a.svg');
    expect(t('en', 'exportar.listo', { nombre: 'a.svg' })).toBe('Done: a.svg');
    expect(t('es', 'pie-vista', { base: 66, techo: 0, ancho: 175, alto: 30 })).toBe('66–0 Ma · 175 × 30 mm');
  });

  it('sin una clave regresa la clave; sin un idioma usa el español', () => {
    expect(t('es', 'no-existe')).toBe('no-existe');
    expect(t('fr', 'saltar')).toBe('Saltar a la vista previa');
  });

  it('escribe el error en el idioma pedido, con sus datos traducidos', () => {
    const e = { campo: 'ancho_mm', codigo: 'tamano-fuera-de-rango', datos: { dimension: 'ancho', min: 1, max: 2000 } };
    expect(mensajeDeError('es', e)).toBe('El ancho debe ser un número entre 1 y 2000 mm.');
    expect(mensajeDeError('en', e)).toBe('The width must be a number between 1 and 2000 mm.');
    expect(mensajeDeError('en', { codigo: 'elige-rango', datos: {} })).toBe('Choose at least one rank.');
  });

  it('un error sin código muestra su texto', () => {
    expect(mensajeDeError('en', new Error('algo falló'))).toBe('algo falló');
  });
});

describe('idioma de la interfaz', () => {
  it('cambia, avisa y no acepta idiomas desconocidos', () => {
    const idioma = crearIdioma('es');
    const fn = vi.fn();
    idioma.suscribir(fn);
    idioma.cambiar('en');
    expect(idioma.obtener()).toBe('en');
    expect(fn).toHaveBeenCalledWith('en');
    idioma.cambiar('fr');
    idioma.cambiar('en');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(crearIdioma('xx').obtener()).toBe('es');
  });

  it('sin almacenamiento del navegador, empieza en español', () => {
    expect(idiomaGuardado()).toBe('es');
  });
});
