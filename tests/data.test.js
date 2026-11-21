// Pruebas de los datos de la carta ICS v2026/06 (data/ics-2026-06.json).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import datos from '../data/ics-2026-06.json';
import { CARTA } from '../scripts/carta-ics-2026-06.js';
import { crearId, leerEtiqueta } from '../scripts/build-data.js';

const RANGOS = ['eon', 'era', 'periodo', 'epoca', 'edad'];
const CAMPOS = [
  'id', 'rango', 'nombre_en', 'nombre_es', 'abrev', 'base_ma', 'base_texto', 'techo_ma',
  'incertidumbre_ma', 'incertidumbre_texto', 'aproximada', 'informal', 'color', 'padre',
];
const unidades = datos.unidades;
const porId = new Map(unidades.map((u) => [u.id, u]));
const delRango = (r) => unidades.filter((u) => u.rango === r).sort((a, b) => a.techo_ma - b.techo_ma);
const hijosDe = (id) => unidades.filter((u) => u.padre === id).sort((a, b) => a.techo_ma - b.techo_ma);
const sinHijos = (r) => delRango(r).filter((u) => hijosDe(u.id).length === 0).map((u) => u.id);

describe('metadatos', () => {
  it('indica la versión, la fuente y la cita de la carta', () => {
    expect(datos.version).toBe('2026/06');
    expect(datos.fuente).toBe('ICS International Chronostratigraphic Chart');
    expect(datos.cita).toMatch(/Cohen et al\. \(2025\) Episodes 48\(1\)/);
  });

  it('tiene el número esperado de unidades por rango', () => {
    const conteo = Object.fromEntries(RANGOS.map((r) => [r, delRango(r).length]));
    expect(conteo).toEqual({ eon: 4, era: 10, periodo: 22, epoca: 38, edad: 101 });
  });
});

describe('cada unidad', () => {
  it('tiene un id único', () => {
    expect(porId.size).toBe(unidades.length);
  });

  it.each(unidades)('$id: campos, rango, nombres y color válidos', (u) => {
    const extra = Object.keys(u).filter((k) => !CAMPOS.includes(k) && k !== 'revisar');
    expect(extra).toEqual([]);
    for (const campo of CAMPOS) expect(u).toHaveProperty(campo);
    expect(RANGOS).toContain(u.rango);
    expect(u.nombre_es.trim()).not.toBe('');
    expect(u.nombre_en.trim()).not.toBe('');
    expect(u.nombre_es).toBe(u.nombre_es.trim());
    expect(u.nombre_en).toBe(u.nombre_en.trim());
    expect(u.color).toMatch(/^#[0-9A-F]{6}$/);
    expect(typeof u.aproximada).toBe('boolean');
    expect(typeof u.informal).toBe('boolean');
    if (u.abrev !== null) expect(u.abrev.trim()).not.toBe('');
    if ('revisar' in u) expect(u.revisar).toBe(true);
  });

  it.each(unidades)('$id: base_ma > techo_ma ≥ 0 e incertidumbre positiva o nula', (u) => {
    expect(u.base_ma).toBeGreaterThan(u.techo_ma);
    expect(u.techo_ma).toBeGreaterThanOrEqual(0);
    if (u.incertidumbre_ma !== null) expect(u.incertidumbre_ma).toBeGreaterThan(0);
  });

  it.each(unidades)('$id: base_texto e incertidumbre_texto son los mismos números, sin ~ ni ±', (u) => {
    expect(u.base_texto).toMatch(/^\d+(\.\d+)?$/);
    expect(Number(u.base_texto)).toBe(u.base_ma);
    if (u.incertidumbre_ma === null) {
      expect(u.incertidumbre_texto).toBeNull();
    } else {
      expect(u.incertidumbre_texto).toMatch(/^\d+(\.\d+)?$/);
      expect(Number(u.incertidumbre_texto)).toBe(u.incertidumbre_ma);
    }
  });

  it('las unidades que comparten un límite lo escriben igual (texto, ~ y ±)', () => {
    const porLimite = new Map();
    for (const u of unidades) {
      const nota = JSON.stringify([u.base_texto, u.aproximada, u.incertidumbre_texto]);
      porLimite.set(u.base_ma, new Set([...(porLimite.get(u.base_ma) ?? []), nota]));
    }
    for (const [ma, notas] of porLimite) expect(notas.size, `${ma} Ma`).toBe(1);
  });
});

describe('jerarquía', () => {
  it('los eones no tienen padre y las demás unidades sí, de un rango superior', () => {
    for (const u of unidades) {
      if (u.rango === 'eon') {
        expect(u.padre, u.id).toBeNull();
      } else {
        const padre = porId.get(u.padre);
        expect(padre, `${u.id} → ${u.padre}`).toBeDefined();
        expect(RANGOS.indexOf(padre.rango), u.id).toBeLessThan(RANGOS.indexOf(u.rango));
      }
    }
  });

  it('cada hijo cae dentro de su padre', () => {
    for (const u of unidades.filter((x) => x.padre)) {
      const p = porId.get(u.padre);
      expect(u.techo_ma, u.id).toBeGreaterThanOrEqual(p.techo_ma);
      expect(u.base_ma, u.id).toBeLessThanOrEqual(p.base_ma);
    }
  });

  it('los hijos de cada unidad la cubren exactamente, sin huecos ni traslapes', () => {
    for (const p of unidades) {
      const hijos = hijosDe(p.id);
      if (hijos.length === 0) continue;
      expect(hijos[0].techo_ma, `techo de ${p.id}`).toBe(p.techo_ma);
      expect(hijos.at(-1).base_ma, `base de ${p.id}`).toBe(p.base_ma);
      for (let i = 1; i < hijos.length; i++) {
        expect(hijos[i].techo_ma, `${hijos[i - 1].id} → ${hijos[i].id}`).toBe(hijos[i - 1].base_ma);
      }
    }
  });

  it('los hijos de una unidad son todos del mismo rango', () => {
    for (const p of unidades) {
      const rangos = new Set(hijosDe(p.id).map((h) => h.rango));
      expect(rangos.size, p.id).toBeLessThanOrEqual(1);
    }
  });

  it.each(RANGOS)('no hay traslapes entre unidades del rango %s', (r) => {
    const lista = delRango(r);
    for (let i = 1; i < lista.length; i++) {
      expect(lista[i].techo_ma, `${lista[i - 1].id} / ${lista[i].id}`).toBeGreaterThanOrEqual(lista[i - 1].base_ma);
    }
  });

  it('los eones cubren de 0 a 4567 Ma sin huecos', () => {
    const eones = delRango('eon');
    expect(eones[0].techo_ma).toBe(0);
    expect(eones.at(-1).base_ma).toBe(4567);
    for (let i = 1; i < eones.length; i++) expect(eones[i].techo_ma).toBe(eones[i - 1].base_ma);
  });

  // Donde falta un rango, la celda del rango superior se extiende (como en la carta)
  it('solo faltan subdivisiones donde la carta no las tiene', () => {
    expect(sinHijos('eon')).toEqual(['eon-hadeano']);
    expect(sinHijos('era')).toEqual([
      'era-neoarqueano', 'era-mesoarqueano', 'era-paleoarqueano', 'era-eoarqueano',
    ]);
    expect(sinHijos('periodo')).toEqual([
      'periodo-ediacariano', 'periodo-criogeniano', 'periodo-toniano', 'periodo-steniano',
      'periodo-ectasiano', 'periodo-calymmiano', 'periodo-statheriano', 'periodo-orosiriano',
      'periodo-rhyaciano', 'periodo-sideriano',
    ]);
    expect(sinHijos('epoca')).toEqual(['epoca-pridoliano']);
  });
});

describe('valores de control (verificados en la carta v2026/06)', () => {
  // [id, base_ma, incertidumbre_ma]
  const control = [
    ['epoca-holoceno', 0.0117, null],
    ['periodo-cuaternario', 2.58, null],
    ['era-cenozoico', 66.0, null],
    ['piso-anisiano', 247.0, null], // cambió en la v2026/06 (antes 246.7)
    ['piso-olenekiano', 250.8, null], // cambió en la v2026/06 (antes 249.9)
    ['era-mesozoico', 251.902, 0.024],
    ['piso-wuchiapingiano', 259.857, 0.084], // cambió en la v2026/06 (antes 259.51)
    ['periodo-cambrico', 538.8, 0.6],
    ['periodo-ediacariano', 635, null],
    ['eon-proterozoico', 2500, null],
    ['eon-arqueano', 4031, 3],
    ['eon-hadeano', 4567, null],
  ];

  it.each(control)('base de %s = %s Ma', (id, base, inc) => {
    const u = porId.get(id);
    expect(u, id).toBeDefined();
    expect(u.base_ma).toBe(base);
    expect(u.incertidumbre_ma).toBe(inc);
  });

  // Las dos cartas difieren en el '~' o el '±' de estos límites; se decidió usar la versión en
  // español (ver data/CHANGELOG-datos.md)
  it.each([
    ['periodo-jurasico', 201.4, 0.2],
    ['periodo-silurico', 443.1, 0.9],
    ['periodo-ordovicico', 486.85, 1.5],
    ['periodo-cambrico', 538.8, 0.6],
  ])('base de %s según la versión en español: %s ± %s, no aproximada', (id, base, inc) => {
    const u = porId.get(id);
    expect(u.base_ma).toBe(base);
    expect(u.incertidumbre_ma).toBe(inc);
    expect(u.aproximada).toBe(false);
    expect(u.revisar).toBeUndefined();
  });

  it('el Holoceno tiene sus tres edades con los nombres de la versión en español', () => {
    expect(hijosDe('epoca-holoceno').map((u) => u.nombre_es)).toEqual([
      'Megalayiano', 'Norgripiano', 'Groenlandiano',
    ]);
  });

  it('marca como informales las unidades sin nombre formal', () => {
    const informales = unidades.filter((u) => u.informal).map((u) => u.id).sort();
    expect(informales).toEqual(
      ['epoca-serie-2', 'piso-10', 'piso-2', 'piso-3', 'piso-4', 'piso-pleistoceno-superior'].sort(),
    );
  });

  it('las edades aproximadas de la carta están marcadas', () => {
    for (const id of ['piso-rhaetiano', 'piso-noriano', 'piso-carniano', 'periodo-ediacariano', 'periodo-criogeniano']) {
      expect(porId.get(id).aproximada, id).toBe(true);
    }
    expect(porId.get('piso-ladiniano').aproximada).toBe(false);
  });
});

describe('trazabilidad', () => {
  it('el JSON está al día con la transcripción de la carta', () => {
    expect(unidades.length).toBe(CARTA.unidades.length);
    for (const c of CARTA.unidades) {
      const u = porId.get(crearId(c.rango, c.es));
      expect(u, c.en).toBeDefined();
      expect(u.base_ma, u.id).toBe(leerEtiqueta(c.base).ma);
      expect(u.base_texto, u.id).toBe(leerEtiqueta(c.base).texto);
      expect(u.incertidumbre_texto, u.id).toBe(leerEtiqueta(c.base).incTexto);
      expect(u.techo_ma, u.id).toBe(leerEtiqueta(c.techo).ma);
      expect(u.color, u.id).toBe(c.color);
      expect(u.nombre_en, u.id).toBe(c.en);
      expect(u.revisar === true, u.id).toBe(Boolean(c.revisar));
    }
  });

  it('cada unidad marcada para revisar está documentada en CHANGELOG-datos.md', () => {
    const changelog = readFileSync(new URL('../data/CHANGELOG-datos.md', import.meta.url), 'utf8');
    for (const u of unidades.filter((x) => x.revisar)) {
      expect(changelog, u.id).toContain(`\`${u.id}\``);
    }
  });
});

describe('lectura de etiquetas de la carta', () => {
  it.each([
    ['0', { ma: 0, texto: '0', inc: null, incTexto: null, aprox: false }],
    ['3.600', { ma: 3.6, texto: '3.600', inc: null, incTexto: null, aprox: false }],
    ['66.00', { ma: 66, texto: '66.00', inc: null, incTexto: null, aprox: false }],
    ['~237', { ma: 237, texto: '237', inc: null, incTexto: null, aprox: true }],
    ['259.857 ± 0.084', { ma: 259.857, texto: '259.857', inc: 0.084, incTexto: '0.084', aprox: false }],
    ['161.5 ± 1.0', { ma: 161.5, texto: '161.5', inc: 1, incTexto: '1.0', aprox: false }],
    ['~538.8 ± 0.6', { ma: 538.8, texto: '538.8', inc: 0.6, incTexto: '0.6', aprox: true }],
  ])('%s', (texto, esperado) => {
    expect(leerEtiqueta(texto)).toEqual(esperado);
  });

  it('rechaza etiquetas que no reconoce', () => {
    expect(() => leerEtiqueta('cerca de 500')).toThrow();
  });
});
