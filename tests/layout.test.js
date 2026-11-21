// Pruebas del cálculo de geometría (src/layout.js) con los datos reales de la carta.
import { describe, expect, it } from 'vitest';
import datos from '../data/ics-2026-06.json';
import { asignarCeldas, calcularFigura, calcularLayout, mmAPx, ptAMm, pxAMm, RANGOS } from '../src/layout.js';
import { ALTURA_MAYUSCULAS_EM, medirTexto } from '../src/labels.js';

const unidades = datos.unidades;
const porId = new Map(unidades.map((u) => [u.id, u]));
const TRES = ['periodo', 'epoca', 'edad'];
const EPS = 1e-9;

const layout = (opciones) =>
  calcularLayout(unidades, {
    techo_ma: 0,
    base_ma: 66,
    rangos: TRES,
    orientacion: 'horizontal',
    escala: 'proporcional',
    ancho_mm: 175,
    alto_mm: 24,
    ...opciones,
  });

const celda = (geo, id) => geo.celdas.find((c) => c.id === id);
const filaMasFina = (geo) => geo.celdas.filter((c) => c.fila + c.n_filas === geo.filas.length);
const area = (c) => c.ancho * c.alto;

/** Las celdas cubren exactamente el rectángulo pedido: sin salirse, sin huecos y sin traslapes. */
function verificarMosaico(geo) {
  const W = geo.ancho_mm;
  const H = geo.alto_mm;
  for (const c of geo.celdas) {
    expect(c.ancho, c.id).toBeGreaterThan(0);
    expect(c.alto, c.id).toBeGreaterThan(0);
    expect(c.x, c.id).toBeGreaterThanOrEqual(-EPS);
    expect(c.y, c.id).toBeGreaterThanOrEqual(-EPS);
    expect(c.x + c.ancho, c.id).toBeLessThanOrEqual(W + EPS);
    expect(c.y + c.alto, c.id).toBeLessThanOrEqual(H + EPS);
  }
  const celdas = geo.celdas;
  for (let i = 0; i < celdas.length; i++) {
    for (let j = i + 1; j < celdas.length; j++) {
      const a = celdas[i];
      const b = celdas[j];
      const dx = Math.min(a.x + a.ancho, b.x + b.ancho) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.alto, b.y + b.alto) - Math.max(a.y, b.y);
      const traslape = dx > 0 && dy > 0 ? dx * dy : 0;
      expect(traslape, `${a.id} / ${b.id}`).toBeLessThan(1e-9);
    }
  }
  // Sin traslapes y dentro del rectángulo: si las áreas suman W × H, no hay huecos
  const suma = celdas.reduce((s, c) => s + area(c), 0);
  expect(suma).toBeCloseTo(W * H, 6);
}

describe('conversión de unidades', () => {
  it('mm → px a la resolución indicada', () => {
    expect(mmAPx(25.4, 300)).toBe(300);
    expect(mmAPx(25.4, 600)).toBe(600);
    expect(mmAPx(25.4)).toBe(96); // pantalla (CSS)
    expect(mmAPx(85, 300)).toBeCloseTo(1003.937, 3); // 1 columna a 300 dpi
    expect(mmAPx(175, 600)).toBeCloseTo(4133.858, 3); // 2 columnas a 600 dpi
  });

  it('px → mm y pt → mm', () => {
    expect(pxAMm(96, 96)).toBe(25.4);
    expect(pxAMm(300, 300)).toBe(25.4);
    expect(ptAMm(72)).toBe(25.4);
    expect(ptAMm(1)).toBeCloseTo(0.352778, 6);
    expect(ptAMm(7)).toBeCloseTo(2.469444, 6);
  });

  it.each([1, 85, 120, 175, 300])('ida y vuelta mm → px → mm (%s mm)', (mm) => {
    for (const dpi of [96, 300, 600]) expect(pxAMm(mmAPx(mm, dpi), dpi)).toBeCloseTo(mm, 10);
  });
});

describe('las celdas llenan exactamente el tamaño pedido', () => {
  const casos = [];
  for (const orientacion of ['horizontal', 'vertical']) {
    for (const escala of ['proporcional', 'uniforme']) {
      const tam = orientacion === 'horizontal' ? { ancho_mm: 175, alto_mm: 24 } : { ancho_mm: 60, alto_mm: 150 };
      casos.push([`0–66 Ma, ${orientacion}, ${escala}`, { orientacion, escala, ...tam }]);
      casos.push([`10–30 Ma (recortado), ${orientacion}, ${escala}`, { techo_ma: 10, base_ma: 30, orientacion, escala, ...tam }]);
      casos.push([
        `0–4567 Ma, cinco rangos, ${orientacion}, ${escala}`,
        { base_ma: 4567, rangos: RANGOS, orientacion, escala, ...tam },
      ]);
      casos.push([
        `500–3000 Ma (recortado, Precámbrico), ${orientacion}, ${escala}, invertida`,
        { techo_ma: 500, base_ma: 3000, rangos: RANGOS, orientacion, escala, invertir: true, ...tam },
      ]);
    }
  }

  it.each(casos)('%s', (_, opciones) => {
    verificarMosaico(layout(opciones));
  });

  it('cada fila cubre el intervalo completo, sin huecos', () => {
    const geo = layout({ techo_ma: 10, base_ma: 30 });
    for (let fila = 0; fila < geo.filas.length; fila++) {
      const enFila = geo.celdas
        .filter((c) => c.fila <= fila && fila < c.fila + c.n_filas)
        .sort((a, b) => a.techo_ma - b.techo_ma);
      expect(enFila[0].techo_ma).toBe(10);
      expect(enFila.at(-1).base_ma).toBe(30);
      for (let i = 1; i < enFila.length; i++) expect(enFila[i].techo_ma).toBe(enFila[i - 1].base_ma);
      expect(enFila.reduce((s, c) => s + c.ancho, 0)).toBeCloseTo(175, 9);
    }
  });
});

describe('intervalo recortado', () => {
  const geo = layout({ techo_ma: 10, base_ma: 30 });

  it('las edades de las celdas quedan dentro del intervalo', () => {
    for (const c of geo.celdas) {
      expect(c.techo_ma, c.id).toBeGreaterThanOrEqual(10);
      expect(c.base_ma, c.id).toBeLessThanOrEqual(30);
    }
  });

  it('marca como recortadas solo las celdas cortadas por los extremos', () => {
    for (const c of geo.celdas) {
      const u = porId.get(c.id);
      const cortada = u.techo_ma < 10 || u.base_ma > 30;
      expect(c.recortada, c.id).toBe(cortada);
    }
    expect(celda(geo, 'periodo-neogeno').recortada).toBe(true);
    expect(celda(geo, 'periodo-paleogeno').recortada).toBe(true);
    expect(celda(geo, 'piso-aquitaniano').recortada).toBe(false);
  });

  it('los límites van del techo a la base del intervalo', () => {
    expect(geo.limites[0]).toEqual({ ma: 10, pos: 175 });
    expect(geo.limites.at(-1)).toEqual({ ma: 30, pos: 0 });
    expect(geo.limites.length).toBe(filaMasFina(geo).length + 1);
  });
});

describe('escala proporcional', () => {
  const geo = layout({});

  it('el ancho de cada celda es proporcional a su duración', () => {
    const neogeno = celda(geo, 'periodo-neogeno');
    expect(neogeno.ancho).toBeCloseTo(((23.04 - 2.58) / 66) * 175, 9);
    expect(neogeno.x).toBeCloseTo(((66 - 23.04) / 66) * 175, 9);
    for (const c of geo.celdas) {
      expect(c.ancho, c.id).toBeCloseTo(((c.base_ma - c.techo_ma) / 66) * 175, 9);
    }
  });

  it('los límites quedan en su posición lineal', () => {
    for (const l of geo.limites) expect(l.pos).toBeCloseTo(((66 - l.ma) / 66) * 175, 9);
  });
});

describe('escala uniforme', () => {
  it('todas las celdas de la fila más fina miden lo mismo, incluidas las tres del Holoceno', () => {
    const geo = layout({ escala: 'uniforme' });
    const finas = filaMasFina(geo);
    const edadesCenozoico = unidades.filter((u) => u.rango === 'edad' && u.base_ma <= 66).length;
    expect(finas.length).toBe(edadesCenozoico);
    for (const c of finas) expect(c.ancho, c.id).toBeCloseTo(175 / finas.length, 9);
    for (const id of ['piso-megalayiano', 'piso-norgripiano', 'piso-groenlandiano']) {
      expect(celda(geo, id).ancho).toBeGreaterThan(5);
    }
  });

  it('una celda gruesa mide lo que suman sus celdas finas', () => {
    const geo = layout({ escala: 'uniforme' });
    const holoceno = celda(geo, 'epoca-holoceno');
    expect(holoceno.ancho).toBeCloseTo(3 * celda(geo, 'piso-megalayiano').ancho, 9);
  });

  it('una celda recortada mide solo la fracción visible de la unidad', () => {
    const geo = layout({ techo_ma: 10, base_ma: 30, escala: 'uniforme' });
    const finas = filaMasFina(geo);
    const pesos = finas.map((c) => {
      const u = porId.get(c.id);
      return (c.base_ma - c.techo_ma) / (u.base_ma - u.techo_ma);
    });
    const total = pesos.reduce((s, p) => s + p, 0);
    finas.forEach((c, i) => expect(c.ancho, c.id).toBeCloseTo((pesos[i] / total) * 175, 9));
    expect(finas.some((c) => c.recortada)).toBe(true);
  });

  it('las celdas extendidas del Precámbrico cuentan como una celda de la fila más fina', () => {
    const geo = layout({ base_ma: 4567, rangos: RANGOS, escala: 'uniforme' });
    const finas = filaMasFina(geo);
    for (const c of finas) expect(c.ancho, c.id).toBeCloseTo(175 / finas.length, 9);
    expect(finas.map((c) => c.id)).toContain('eon-hadeano');
  });
});

describe('orientación y sentido', () => {
  it('horizontal: lo más antiguo a la izquierda y los rangos gruesos arriba', () => {
    const geo = layout({});
    const paleoceno = celda(geo, 'epoca-paleoceno');
    const megalayiano = celda(geo, 'piso-megalayiano');
    expect(paleoceno.x).toBe(0);
    expect(megalayiano.x + megalayiano.ancho).toBeCloseTo(175, 9);
    expect(celda(geo, 'periodo-neogeno').y).toBe(0);
    expect(celda(geo, 'periodo-neogeno').alto).toBeCloseTo(8, 9);
    expect(celda(geo, 'epoca-mioceno').y).toBeCloseTo(8, 9);
    expect(megalayiano.y + megalayiano.alto).toBeCloseTo(24, 9);
  });

  it('horizontal invertida: el presente a la izquierda', () => {
    const geo = layout({ invertir: true });
    expect(celda(geo, 'piso-megalayiano').x).toBe(0);
    const daniano = celda(geo, 'piso-daniano');
    expect(daniano.x + daniano.ancho).toBeCloseTo(175, 9);
  });

  it('vertical: lo más antiguo abajo y los rangos gruesos a la izquierda', () => {
    const geo = layout({ orientacion: 'vertical', ancho_mm: 60, alto_mm: 150 });
    const megalayiano = celda(geo, 'piso-megalayiano');
    const daniano = celda(geo, 'piso-daniano');
    expect(megalayiano.y).toBe(0);
    expect(daniano.y + daniano.alto).toBeCloseTo(150, 9);
    const neogeno = celda(geo, 'periodo-neogeno');
    expect(neogeno.x).toBe(0);
    expect(neogeno.ancho).toBeCloseTo(20, 9);
    expect(neogeno.alto).toBeCloseTo(((23.04 - 2.58) / 66) * 150, 9);
    expect(megalayiano.x + megalayiano.ancho).toBeCloseTo(60, 9);
    expect(geo.limites[0]).toEqual({ ma: 0, pos: 0 });
    expect(geo.limites.at(-1)).toEqual({ ma: 66, pos: 150 });
  });

  it('vertical invertida: lo más antiguo arriba', () => {
    const geo = layout({ orientacion: 'vertical', ancho_mm: 60, alto_mm: 150, invertir: true });
    expect(celda(geo, 'piso-daniano').y).toBe(0);
    const megalayiano = celda(geo, 'piso-megalayiano');
    expect(megalayiano.y + megalayiano.alto).toBeCloseTo(150, 9);
  });

  it('el orden en que se piden los rangos no importa', () => {
    const a = layout({ rangos: ['edad', 'periodo', 'epoca'] });
    expect(a.filas).toEqual(TRES);
    expect(a).toEqual(layout({}));
  });
});

describe('rangos faltantes: la celda superior se extiende', () => {
  const geo = layout({ base_ma: 4567, rangos: RANGOS, alto_mm: 40 });
  const ocupa = (id) => {
    const c = celda(geo, id);
    return [c.fila, c.n_filas];
  };

  it('el Hádico ocupa las cinco filas', () => {
    expect(ocupa('eon-hadeano')).toEqual([0, 5]);
    expect(celda(geo, 'eon-hadeano').alto).toBe(40);
  });

  it('las eras del Arqueano ocupan las filas de era a edad', () => {
    for (const id of ['era-neoarqueano', 'era-mesoarqueano', 'era-paleoarqueano', 'era-eoarqueano']) {
      expect(ocupa(id), id).toEqual([1, 4]);
    }
  });

  it('los periodos del Proterozoico ocupan las filas de periodo a edad', () => {
    for (const id of ['periodo-ediacariano', 'periodo-toniano', 'periodo-sideriano']) {
      expect(ocupa(id), id).toEqual([2, 3]);
      expect(celda(geo, id).alto).toBeCloseTo(24, 9);
    }
  });

  it('el Pridoliano, sin pisos, ocupa las filas de época y edad', () => {
    expect(ocupa('epoca-pridoliano')).toEqual([3, 2]);
  });

  it('las unidades con subdivisiones ocupan solo su fila', () => {
    expect(ocupa('eon-fanerozoico')).toEqual([0, 1]);
    expect(ocupa('periodo-silurico')).toEqual([2, 1]);
    expect(ocupa('piso-daniano')).toEqual([4, 1]);
  });

  it('cada unidad aparece una sola vez (nunca en forma de L)', () => {
    const ids = geo.celdas.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(unidades.length);
  });

  it('una unidad de un rango no elegido cubre el hueco (eras del Arqueano en la fila de periodos)', () => {
    const g = layout({ base_ma: 4567, rangos: TRES });
    const neoarqueano = celda(g, 'era-neoarqueano');
    expect([neoarqueano.fila, neoarqueano.n_filas]).toEqual([0, 3]);
    expect([celda(g, 'eon-hadeano').fila, celda(g, 'eon-hadeano').n_filas]).toEqual([0, 3]);
    expect(g.celdas.some((c) => c.id === 'eon-arqueano')).toBe(false);
    verificarMosaico(g);
  });

  it('con una sola fila de edades, el Precámbrico se llena con periodos, eras y el Hádico', () => {
    const g = layout({ base_ma: 4567, rangos: ['edad'] });
    const rangosVistos = new Set(g.celdas.map((c) => c.rango));
    expect(rangosVistos).toEqual(new Set(['eon', 'era', 'periodo', 'epoca', 'edad']));
    expect(celda(g, 'epoca-pridoliano').rango).toBe('epoca');
    for (const c of g.celdas) expect(c.n_filas).toBe(1);
  });

  it('no aparecen rangos más finos que la última fila', () => {
    const g = layout({ rangos: ['periodo'] });
    expect(g.celdas.map((c) => c.id)).toEqual(['periodo-cuaternario', 'periodo-neogeno', 'periodo-paleogeno']);
  });

  it('asignarCeldas regresa las unidades sin geometría', () => {
    const asignadas = asignarCeldas(unidades, { techo_ma: 0, base_ma: 0.0117, rangos: ['epoca', 'edad'] });
    expect(asignadas.map((c) => [c.unidad.id, c.fila, c.n_filas])).toEqual([
      ['epoca-holoceno', 0, 1],
      ['piso-megalayiano', 1, 1],
      ['piso-norgripiano', 1, 1],
      ['piso-groenlandiano', 1, 1],
    ]);
  });
});

describe('datos de cada celda', () => {
  it('copia nombres, color e informalidad de la unidad', () => {
    const g = layout({ techo_ma: 506.5, base_ma: 538.8, rangos: ['epoca', 'edad'] });
    const piso2 = celda(g, 'piso-2');
    expect(piso2).toMatchObject({ nombre_es: 'Piso 2', nombre_en: 'Stage 2', informal: true, rango: 'edad' });
    expect(piso2.color).toBe(porId.get('piso-2').color);
    expect(celda(g, 'piso-fortuniano').informal).toBe(false);
  });
});

describe('opciones inválidas', () => {
  it.each([
    ['base igual al techo', { techo_ma: 10, base_ma: 10 }],
    ['base más joven que el techo', { techo_ma: 30, base_ma: 10 }],
    ['techo negativo', { techo_ma: -1 }],
    ['base más antigua que la Tierra', { base_ma: 5000 }],
    ['sin base', { base_ma: undefined }],
    ['sin rangos', { rangos: [] }],
    ['rango desconocido', { rangos: ['sistema'] }],
    ['rango repetido', { rangos: ['edad', 'edad'] }],
    ['orientación desconocida', { orientacion: 'diagonal' }],
    ['escala desconocida', { escala: 'logaritmica' }],
    ['ancho cero', { ancho_mm: 0 }],
    ['alto no numérico', { alto_mm: '24' }],
  ])('%s', (_, opciones) => {
    expect(() => layout(opciones)).toThrow();
  });

  it('sin unidades', () => {
    expect(() => calcularLayout([], { base_ma: 66, rangos: TRES, ancho_mm: 175, alto_mm: 24 })).toThrow();
  });
});

describe('figura completa (barra + eje + etiquetas)', () => {
  const figura = (op) =>
    calcularFigura(unidades, {
      techo_ma: 0,
      base_ma: 66,
      rangos: TRES,
      orientacion: 'horizontal',
      ancho_mm: 175,
      alto_mm: 30,
      ...op,
    });

  /** Todo cabe en la figura y el eje no se encima con la barra. */
  function verificarFigura(f) {
    const { barra } = f;
    const dentro = (x, y) => {
      expect(x).toBeGreaterThanOrEqual(-EPS);
      expect(y).toBeGreaterThanOrEqual(-EPS);
      expect(x).toBeLessThanOrEqual(f.ancho_mm + EPS);
      expect(y).toBeLessThanOrEqual(f.alto_mm + EPS);
    };
    dentro(barra.x, barra.y);
    dentro(barra.x + barra.ancho, barra.y + barra.alto);
    // Las celdas llenan exactamente la barra
    verificarMosaico({
      ancho_mm: barra.ancho,
      alto_mm: barra.alto,
      celdas: f.celdas.map((c) => ({ ...c, x: c.x - barra.x, y: c.y - barra.y })),
    });
    if (!f.eje) return;
    const horizontal = f.orientacion === 'horizontal';
    const tamano = f.tamano_fuente_mm;
    for (const m of f.eje.marcas) {
      dentro(m.x1, m.y1);
      dentro(m.x2, m.y2);
      if (horizontal) expect(m.y1).toBeCloseTo(barra.y + barra.alto, 9);
      else expect(m.x1).toBeCloseTo(barra.x + barra.ancho, 9);
    }
    // Los números (y ~, ±) no bajan de la línea base y suben hasta la altura de las mayúsculas
    for (const n of f.eje.numeros) {
      const ancho = medirTexto(n.texto, tamano);
      const arriba = n.y - ALTURA_MAYUSCULAS_EM * tamano;
      if (horizontal) {
        dentro(n.x - ancho / 2, arriba);
        dentro(n.x + ancho / 2, n.y);
        expect(arriba).toBeGreaterThan(barra.y + barra.alto);
      } else {
        dentro(n.x, arriba);
        dentro(n.x + ancho, n.y);
        expect(n.x).toBeGreaterThan(barra.x + barra.ancho);
      }
    }
    dentro(f.eje.titulo.x, f.eje.titulo.y);
  }

  const casos = [];
  for (const orientacion of ['horizontal', 'vertical']) {
    for (const escala of ['proporcional', 'uniforme']) {
      for (const eje of ['auto', 'intervalo', 'limites', 'ninguno']) {
        const tam = orientacion === 'horizontal' ? { ancho_mm: 175, alto_mm: 30 } : { ancho_mm: 30, alto_mm: 175 };
        casos.push([`${orientacion}, ${escala}, eje ${eje}`, { orientacion, escala, eje, eje_paso_ma: 5, ...tam }]);
      }
    }
  }
  casos.push(['Precámbrico, cinco rangos', { base_ma: 4567, rangos: RANGOS, alto_mm: 40 }]);
  casos.push(['recortada, invertida, con ± y ~', { techo_ma: 200, base_ma: 260, eje: 'limites', incertidumbre: true, invertir: true }]);

  it.each(casos)('%s: todo cabe y la barra se llena', (_, op) => {
    verificarFigura(figura(op));
  });

  it('sin eje, la barra ocupa toda la figura', () => {
    const f = figura({ eje: 'ninguno' });
    expect(f.barra).toEqual({ x: 0, y: 0, ancho: 175, alto: 30 });
    expect(f.eje).toBeNull();
  });

  it('con eje, la barra se acorta y el eje va abajo (horizontal) o a la derecha (vertical)', () => {
    const h = figura({});
    expect(h.barra.y).toBe(0);
    expect(h.barra.alto).toBeLessThan(30);
    expect(h.eje.titulo.texto).toBe('Edad (Ma)');
    expect(h.eje.titulo.y).toBeGreaterThan(h.barra.alto);
    const v = figura({ orientacion: 'vertical', ancho_mm: 30, alto_mm: 175 });
    expect(v.barra.x).toBe(0);
    expect(v.barra.ancho).toBeLessThan(30);
    expect(v.eje.titulo.girada).toBe(true);
  });

  it('en escala uniforme, las marcas automáticas se cambian por las edades de los límites', () => {
    const f = figura({ escala: 'uniforme', eje: 'auto' });
    expect(f.eje.tipo).toBe('limites');
    expect(f.eje.solicitado).toBe('auto');
    expect(f.eje.numeros.map((n) => n.texto)).toContain('23.04');
  });

  it('con edades de los límites, los dos extremos llevan número; la barra deja margen para ellos', () => {
    for (const orientacion of ['horizontal', 'vertical']) {
      const tam = orientacion === 'horizontal' ? {} : { ancho_mm: 30, alto_mm: 175 };
      const f = figura({ eje: 'limites', orientacion, ...tam });
      const textos = f.eje.numeros.map((n) => n.texto);
      expect(textos, orientacion).toContain('0');
      expect(textos, orientacion).toContain('66.00');
      const margenInicio = orientacion === 'horizontal' ? f.barra.x : f.barra.y;
      expect(margenInicio, orientacion).toBeGreaterThan(0);
    }
  });

  it('0–66 Ma en 175 mm: números cada 10 Ma', () => {
    expect(figura({}).eje.numeros.map((n) => n.texto)).toEqual(['0', '10', '20', '30', '40', '50', '60']);
  });

  it('las etiquetas se calculan con la terminología y el tamaño de fuente pedidos', () => {
    const op = { techo_ma: 145, base_ma: 201.4, rangos: ['epoca'], ancho_mm: 175 };
    const textos = (extra) => figura({ ...op, ...extra }).etiquetas.map((e) => e.texto);
    expect(textos({})).toEqual(['Jurásico Superior', 'Jurásico Medio', 'Jurásico Inferior']);
    expect(textos({ terminologia: 'geocronologica' })).toEqual(['Jurásico Tardío', 'Jurásico Medio', 'Jurásico Temprano']);
    expect(figura({ tamano_fuente_pt: 9 }).tamano_fuente_mm).toBeCloseTo(ptAMm(9), 12);
    expect(figura({ tamano_fuente_pt: 4 }).etiquetas.length).toBeGreaterThan(figura({ tamano_fuente_pt: 10 }).etiquetas.length);
  });

  it('cada celda lleva su nombre completo', () => {
    const f = figura({ terminologia: 'geocronologica', techo_ma: 0.0117, base_ma: 2.58 });
    expect(f.celdas.find((c) => c.id === 'piso-pleistoceno-superior').nombre).toBe('Pleistoceno Tardío');
  });

  it('opciones inválidas o una figura demasiado pequeña para el eje', () => {
    expect(() => figura({ eje: 'otro' })).toThrow();
    expect(() => figura({ terminologia: 'otra' })).toThrow();
    expect(() => figura({ tamano_fuente_pt: 0 })).toThrow();
    expect(() => figura({ alto_mm: 5 })).toThrow(/demasiado pequeña/);
    expect(() => figura({ alto_mm: 5, eje: 'ninguno' })).not.toThrow();
  });
});

describe('pie de figura', () => {
  const PIE = 'Edades y colores: ICS v2026/06';
  const figura = (op) =>
    calcularFigura(unidades, { base_ma: 66, rangos: TRES, ancho_mm: 175, alto_mm: 30, pie: PIE, ...op });

  it('va abajo a la izquierda, dentro de la figura y debajo del eje', () => {
    const f = figura({});
    expect(f.alto_mm).toBe(30);
    expect(f.pie.lineas).toHaveLength(1);
    const [linea] = f.pie.lineas;
    expect(linea).toMatchObject({ texto: PIE, x: 0, ancla: 'start' });
    expect(linea.y + 0.25 * f.tamano_fuente_mm).toBeLessThanOrEqual(30); // con el descendente
    expect(linea.y - ALTURA_MAYUSCULAS_EM * f.tamano_fuente_mm).toBeGreaterThan(f.eje.titulo.y);
    expect(medirTexto(PIE, f.tamano_fuente_mm)).toBeLessThanOrEqual(175);
  });

  it('ocupa espacio dentro del tamaño pedido: la barra queda más baja', () => {
    const con = figura({});
    const sin = figura({ pie: null });
    expect(con.barra.alto).toBeLessThan(sin.barra.alto);
    expect(sin.pie).toBeNull();
    expect(sin.pie_omitido).toBe(false);
  });

  it('en una figura vertical angosta se divide en dos líneas', () => {
    const f = figura({ orientacion: 'vertical', ancho_mm: 30, alto_mm: 175 });
    expect(f.pie.lineas.map((l) => l.texto)).toEqual(['Edades y colores:', 'ICS v2026/06']);
    for (const l of f.pie.lineas) {
      expect(medirTexto(l.texto, f.tamano_fuente_mm)).toBeLessThanOrEqual(30);
      expect(l.y).toBeLessThanOrEqual(175);
      expect(l.y - ALTURA_MAYUSCULAS_EM * f.tamano_fuente_mm).toBeGreaterThan(f.barra.y + f.barra.alto);
    }
  });

  it('si no cabe ni en dos líneas, se omite y se avisa', () => {
    const f = figura({ orientacion: 'vertical', ancho_mm: 12, alto_mm: 175, eje: 'ninguno' });
    expect(f.pie).toBeNull();
    expect(f.pie_omitido).toBe(true);
  });

  it('una figura demasiado baja para el pie da un error claro', () => {
    expect(() => figura({ alto_mm: 3, eje: 'ninguno' })).toThrow(/pie/);
  });
});

describe('escala de grises e idioma de las etiquetas', () => {
  const figura = (op) => calcularFigura(unidades, { base_ma: 66, rangos: TRES, ancho_mm: 175, alto_mm: 30, ...op });

  it('en escala de grises, cada celda es gris y conserva el color de la carta', () => {
    const color = figura({});
    const gris = figura({ grises: true });
    expect(gris.grises).toBe(true);
    gris.celdas.forEach((c, i) => {
      expect(c.color, c.id).toMatch(/^#([0-9A-F]{2})\1\1$/);
      expect(c.color_carta).toBe(color.celdas[i].color);
    });
    // El texto se elige igual (negro o blanco) y queda en el mismo lugar
    expect(gris.etiquetas.map((e) => [e.texto, e.color, e.x])).toEqual(color.etiquetas.map((e) => [e.texto, e.color, e.x]));
  });

  it('las etiquetas, el título del eje y el idioma de la figura siguen la opción idioma', () => {
    const en = figura({ idioma: 'en' });
    expect(en.idioma).toBe('en');
    expect(en.etiquetas.map((e) => e.texto)).toContain('Neogene');
    expect(en.eje.titulo.texto).toBe('Age (Ma)');
    expect(figura({}).idioma).toBe('es');
  });
});
