// Pruebas del eje de edades (src/eje.js).
import { describe, expect, it } from 'vitest';
import datos from '../data/ics-2026-06.json';
import { decimalesDe, marcasCada, marcasDelEje, pasoAutomatico, posicionDeEdad } from '../src/eje.js';
import { calcularLayout } from '../src/layout.js';
import { medirTexto } from '../src/labels.js';

const unidades = datos.unidades;

describe('paso automático', () => {
  it.each([
    [66, 175, 10],
    [66, 85, 20],
    [4567, 175, 500],
    [23.04, 175, 5], // con 2 serían 11.5 intervalos y solo caben 11
    [2.58, 120, 0.5],
    [0.0117, 175, 0.002],
    [1, 85, 0.2],
  ])('%s Ma en %s mm → cada %s Ma', (duracion, largo, paso) => {
    expect(pasoAutomatico(duracion, largo)).toBe(paso);
  });

  it('siempre es 1, 2 o 5 × 10ⁿ y deja al menos 15 mm entre marcas', () => {
    for (const duracion of [0.01, 0.3, 7, 66, 541, 4567]) {
      for (const largo of [40, 85, 120, 175, 400]) {
        const paso = pasoAutomatico(duracion, largo);
        const mantisa = Number((paso / 10 ** Math.floor(Math.log10(paso))).toPrecision(6));
        expect([1, 2, 5]).toContain(mantisa);
        const maxMarcas = Math.max(1, Math.floor(largo / 15));
        expect(duracion / paso).toBeLessThanOrEqual(maxMarcas + 1e-9);
      }
    }
  });
});

describe('marcas a intervalos fijos', () => {
  it.each([
    [10, 0],
    [1, 0],
    [0.5, 1],
    [2.5, 1],
    [0.05, 2],
    [0.002, 3],
  ])('decimales de %s: %s', (paso, d) => {
    expect(decimalesDe(paso)).toBe(d);
  });

  it('sin errores de redondeo en los números', () => {
    const marcas = marcasCada(0, 1, 0.1);
    expect(marcas).toHaveLength(11);
    expect(marcas[3]).toEqual({ ma: 0.3, texto: '0.3', k: 3 });
    expect(marcas.map((m) => m.texto).join(' ')).toBe('0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0');
  });

  it('solo dentro del intervalo, incluidos los extremos', () => {
    expect(marcasCada(10, 30, 10).map((m) => m.ma)).toEqual([10, 20, 30]);
    expect(marcasCada(12, 38, 10).map((m) => m.ma)).toEqual([20, 30]);
    expect(marcasCada(1, 7, 10)).toEqual([]);
  });

  it('rechaza un paso de cero o demasiadas marcas', () => {
    expect(() => marcasCada(0, 66, 0)).toThrow();
    expect(() => marcasCada(0, 4567, 1)).toThrow(/más de 1000/);
  });
});

describe('marcas y números sobre una barra', () => {
  const barra = (op) =>
    calcularLayout(unidades, { base_ma: 66, rangos: ['periodo', 'epoca', 'edad'], ancho_mm: 175, alto_mm: 20, ...op });

  it('posicionDeEdad interpola entre los límites', () => {
    const geo = barra({});
    expect(posicionDeEdad(geo, 33)).toBeCloseTo(175 / 2, 9);
    expect(posicionDeEdad(geo, 0)).toBe(175);
    expect(posicionDeEdad(geo, 66)).toBe(0);
  });

  it('marcas automáticas cada 10 Ma en 0–66 Ma', () => {
    const { marcas, etiquetas, paso } = marcasDelEje('auto', barra({}), unidades, { tamano_mm: 2.47 });
    expect(paso).toBe(10);
    expect(etiquetas.map((e) => e.texto)).toEqual(['0', '10', '20', '30', '40', '50', '60']);
    expect(marcas).toHaveLength(7);
    expect(marcas[1].pos).toBeCloseTo(((66 - 10) / 66) * 175, 9);
  });

  it('con marcas muy juntas, los números se escriben cada 2, 5, 10… marcas', () => {
    const { marcas, etiquetas } = marcasDelEje('intervalo', barra({}), unidades, { tamano_mm: 2.47, paso_ma: 0.5 });
    expect(marcas).toHaveLength(133);
    expect(etiquetas.length).toBeLessThan(marcas.length);
    // Dos números seguidos no se enciman
    for (let i = 1; i < etiquetas.length; i++) {
      const a = etiquetas[i - 1];
      const b = etiquetas[i];
      expect(Math.abs(a.pos - b.pos), `${a.texto} / ${b.texto}`).toBeGreaterThanOrEqual((a.extension + b.extension) / 2);
    }
    // Siguen siendo múltiplos "redondos"
    expect(etiquetas.map((e) => e.texto)).toContain('10.0');
  });

  it('edades de los límites: sin encimarse y con los extremos y los límites mayores primero', () => {
    const geo = barra({});
    const { etiquetas, marcas } = marcasDelEje('limites', geo, unidades, { tamano_mm: 2.47 });
    const textos = etiquetas.map((e) => e.texto);
    expect(textos[0]).toBe('66.00');
    expect(textos.at(-1)).toBe('0');
    expect(textos).toContain('23.04'); // base del Neógeno
    expect(textos).not.toContain('0.0042'); // se enciman con el 0
    expect(marcas).toHaveLength(etiquetas.length);
    const ordenadas = [...etiquetas].sort((a, b) => a.pos - b.pos);
    for (let i = 1; i < ordenadas.length; i++) {
      const a = ordenadas[i - 1];
      const b = ordenadas[i];
      expect(b.pos - b.extension / 2, `${a.texto} / ${b.texto}`).toBeGreaterThanOrEqual(a.pos + a.extension / 2);
    }
    expect(etiquetas[0].extension).toBeCloseTo(medirTexto('66.00', 2.47), 12);
  });
});
