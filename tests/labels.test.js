// Pruebas de las etiquetas (src/labels.js).
import { describe, expect, it } from 'vitest';
import datos from '../data/ics-2026-06.json';
import {
  abreviaturasAutomaticas,
  aGris,
  abreviaturasDe,
  abreviaturasRepetidas,
  colorDeTexto,
  contraste,
  elegirSinChoques,
  elegirTexto,
  etiquetasDeCeldas,
  lineasDelPie,
  luminancia,
  medirTexto,
  nombreDeRango,
  nombreDeUnidad,
  nombresDeBusqueda,
  textoDeLimite,
  textoDelPie,
} from '../src/labels.js';

const unidades = datos.unidades;
const porId = new Map(unidades.map((u) => [u.id, u]));
const u = (id) => porId.get(id);

describe('medición del texto', () => {
  it('suma los anchos de Helvetica/Arial', () => {
    // M 833 + i 222 + o 556 + c 500 + e 556 + n 556 + o 556 = 3779 milésimas
    expect(medirTexto('Mioceno', 10)).toBeCloseTo(37.79, 9);
    expect(medirTexto('', 10)).toBe(0);
  });

  it('es proporcional al tamaño y distingue letras anchas y angostas', () => {
    expect(medirTexto('Daniano', 4)).toBeCloseTo(2 * medirTexto('Daniano', 2), 12);
    expect(medirTexto('mmm', 1)).toBeGreaterThan(medirTexto('iii', 1));
  });

  it('las letras acentuadas miden como las letras sin acento', () => {
    expect(medirTexto('Época Cámbrica', 3)).toBe(medirTexto('Epoca Cambrica', 3));
  });
});

describe('terminología', () => {
  const geo = { terminologia: 'geocronologica' };

  it.each([
    ['epoca-cretacico-superior', 'Cretácico Tardío', 'Late Cretaceous'],
    ['epoca-jurasico-inferior', 'Jurásico Temprano', 'Early Jurassic'],
    ['epoca-triasico-medio', 'Triásico Medio', 'Middle Triassic'],
    ['epoca-pensilvaniano-superior', 'Pensilvaniano Tardío', 'Late Pennsylvanian'],
    ['piso-pleistoceno-superior', 'Pleistoceno Tardío', 'Late Pleistocene'],
    ['epoca-serie-2', 'Época 2', 'Epoch 2'],
    ['piso-10', 'Edad 10', 'Age 10'],
    ['piso-2', 'Edad 2', 'Age 2'],
    ['epoca-mioceno', 'Mioceno', 'Miocene'],
  ])('%s → %s / %s', (id, es, en) => {
    expect(nombreDeUnidad(u(id), geo)).toBe(es);
    expect(nombreDeUnidad(u(id), { ...geo, idioma: 'en' })).toBe(en);
  });

  it('la cronoestratigráfica usa los nombres de la carta', () => {
    for (const x of unidades) {
      expect(nombreDeUnidad(x)).toBe(x.nombre_es);
      expect(nombreDeUnidad(x, { idioma: 'en', terminologia: 'cronoestratigrafica' })).toBe(x.nombre_en);
    }
  });

  it('en la geocronológica cambian 20 nombres en cada idioma (los "Medio" no cambian)', () => {
    const cambian = (idioma) =>
      unidades.filter((x) => nombreDeUnidad(x, { ...geo, idioma }) !== (idioma === 'en' ? x.nombre_en : x.nombre_es));
    expect(cambian('es')).toHaveLength(20);
    expect(cambian('en').map((x) => x.id)).toEqual(cambian('es').map((x) => x.id));
    for (const x of cambian('es')) expect(nombreDeUnidad(x, geo)).not.toMatch(/Inferior|Superior|^Serie|^Piso/);
  });

  it('nombres de los rangos', () => {
    expect(['eon', 'era', 'periodo', 'epoca', 'edad'].map((r) => nombreDeRango(r))).toEqual([
      'Eonotema', 'Eratema', 'Sistema', 'Serie', 'Piso',
    ]);
    expect(['eon', 'era', 'periodo', 'epoca', 'edad'].map((r) => nombreDeRango(r, geo))).toEqual([
      'Eón', 'Era', 'Periodo', 'Época', 'Edad',
    ]);
    expect(nombreDeRango('edad', { idioma: 'en' })).toBe('Stage');
    expect(nombreDeRango('edad', { idioma: 'en', terminologia: 'geocronologica' })).toBe('Age');
  });

  it('se puede buscar con cualquiera de los nombres', () => {
    expect(nombresDeBusqueda(u('epoca-cretacico-superior'))).toEqual([
      'Cretácico Superior', 'Cretácico Tardío', 'Upper Cretaceous', 'Late Cretaceous',
    ]);
    expect(nombresDeBusqueda(u('epoca-mioceno'))).toEqual(['Mioceno', 'Miocene']);
  });
});

describe('abreviaturas', () => {
  it.each([
    ['Burdigaliano', ['Burdig.', 'Burd.', 'Bur.']],
    ['Cretácico Superior', ['Cretác. Super.', 'Cret. Sup.', 'Cre. Sup.']],
    ['Groenlandiano', ['Groenl.', 'Groen.', 'Gro.']],
    ['Piso 2', []],
    ['Eo', []],
  ])('automáticas de "%s"', (nombre, esperadas) => {
    expect(abreviaturasAutomaticas(nombre)).toEqual(esperadas);
  });

  it('cada abreviatura automática es más corta que el nombre y que la anterior', () => {
    for (const x of unidades) {
      let anterior = medirTexto(x.nombre_es, 1);
      for (const a of abreviaturasAutomaticas(x.nombre_es)) {
        const ancho = medirTexto(a, 1);
        expect(ancho, `${x.nombre_es} → ${a}`).toBeLessThan(anterior);
        anterior = ancho;
      }
    }
  });

  it('usa la abreviatura de los datos salvo que dos unidades la compartan', () => {
    const repetidas = abreviaturasRepetidas(unidades);
    expect([...repetidas]).toEqual(['St']); // Steniano y Statheriano
    expect(abreviaturasDe(u('periodo-paleogeno'), 'Paleógeno', repetidas)).toEqual(['Pg']);
    expect(abreviaturasDe(u('epoca-mioceno'), 'Mioceno', repetidas)).toEqual(['Mio']);
    expect(abreviaturasDe(u('periodo-steniano'), 'Steniano', repetidas)).toEqual(['Sten.', 'Ste.']);
    expect(abreviaturasDe(u('periodo-statheriano'), 'Statheriano', repetidas)).toEqual(['Stather.', 'Stath.', 'Stat.', 'Sta.']);
    expect(abreviaturasDe(u('piso-aquitaniano'), 'Aquitaniano', repetidas)).toEqual(['Aquitan.', 'Aquit.', 'Aqu.']);
  });
});

describe('color del texto según el contraste', () => {
  it('razón de contraste (WCAG)', () => {
    expect(contraste('#000000', '#FFFFFF')).toBeCloseTo(21, 9);
    expect(contraste('#FFFFFF', '#000000')).toBeCloseTo(21, 9);
    expect(contraste('#777777', '#777777')).toBe(1);
  });

  it.each([
    ['#FFFFFF', '#000000'],
    ['#FFFF00', '#000000'], // amarillo puro
    ['#F2F91D', '#000000'], // Cenozoico
    ['#000000', '#FFFFFF'],
    ['#DA037F', '#FFFFFF'], // Eoarqueano
    ['#AE027E', '#FFFFFF'], // Hádico
    ['#0000FF', '#FFFFFF'],
  ])('sobre %s el texto es %s', (fondo, texto) => {
    expect(colorDeTexto(fondo)).toBe(texto);
  });

  it('en todos los colores de la carta elige el que más contrasta, y llega al nivel AA (4.5:1)', () => {
    for (const x of unidades) {
      const elegido = colorDeTexto(x.color);
      const otro = elegido === '#000000' ? '#FFFFFF' : '#000000';
      expect(contraste(x.color, elegido), x.id).toBeGreaterThanOrEqual(contraste(x.color, otro));
      expect(contraste(x.color, elegido), x.id).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('ajuste del texto en la celda', () => {
  const tamano_mm = 2.5;
  // 'Aquitaniano' mide 13.2 mm y 'Aqu.' 5.1 mm a 2.5 mm de fuente
  const textos = ['Aquitaniano', 'Aquit.', 'Aqu.'];
  const elegir = (ancho, alto, rotar = true) => elegirTexto({ ancho, alto }, textos, { tamano_mm, rotar });

  it('el nombre completo si cabe', () => {
    expect(elegir(20, 5)).toEqual({ texto: 'Aquitaniano', girada: false });
  });

  it('el nombre completo girado si la celda es angosta y alta', () => {
    expect(elegir(5, 20)).toEqual({ texto: 'Aquitaniano', girada: true });
  });

  it('la abreviatura más larga que cabe, antes que una abreviatura girada', () => {
    expect(elegir(8, 5)).toEqual({ texto: 'Aquit.', girada: false });
    expect(elegir(6.5, 8)).toEqual({ texto: 'Aqu.', girada: false });
  });

  it('una abreviatura girada si no cabe ninguna en horizontal', () => {
    expect(elegir(3.5, 8)).toEqual({ texto: 'Aquit.', girada: true });
  });

  it('nada si no cabe', () => {
    expect(elegir(2, 2)).toBeNull();
  });

  it('sin giro, nunca gira', () => {
    expect(elegir(5, 20, false)).toBeNull();
    expect(elegir(6.5, 20, false)).toEqual({ texto: 'Aqu.', girada: false });
  });

  it('las etiquetas de las celdas llevan color, cursivas y el centro de la celda', () => {
    const celdas = [
      { ...u('piso-2'), x: 10, y: 0, ancho: 30, alto: 6 },
      { ...u('eon-hadeano'), x: 40, y: 0, ancho: 30, alto: 6 },
    ];
    const [piso2, hadico] = etiquetasDeCeldas(celdas, unidades, { tamano_mm: 2 });
    expect(piso2).toMatchObject({ id: 'piso-2', texto: 'Piso 2', cursiva: true, color: '#000000', cx: 25, cy: 3 });
    expect(piso2.y).toBeCloseTo(3 + 0.35 * 2, 12);
    expect(hadico).toMatchObject({ texto: 'Hadeano', cursiva: false, color: '#FFFFFF', girada: false });
    const geo = etiquetasDeCeldas(celdas, unidades, { tamano_mm: 2, terminologia: 'geocronologica' });
    expect(geo[0].texto).toBe('Edad 2');
    expect(geo[0].cursiva).toBe(true);
  });
});

describe('edades de los límites', () => {
  it.each([
    [66, false, '66.00'],
    [3.6, false, '3.600'],
    [2.58, false, '2.58'],
    [0, false, '0'],
    [10, false, '10'], // no es un límite: se escribe tal cual
    [251.902, true, '251.902 ± 0.024'],
    [161.5, true, '161.5 ± 1.0'],
    [237, true, '~237'],
    [237, false, '237'],
    [538.8, true, '538.8 ± 0.6'],
  ])('%s Ma (incertidumbre: %s) → "%s"', (ma, incertidumbre, texto) => {
    expect(textoDeLimite(ma, unidades, { incertidumbre })).toBe(texto);
  });

  it('elige las que no se enciman: primero la prioridad, luego la posición', () => {
    const c = (pos, prioridad, extension = 4) => ({ pos, prioridad, extension });
    const elegidas = elegirSinChoques([c(0, 0), c(3, 2), c(5, 1), c(20, 2), c(22, 2)], 1);
    expect(elegidas.map((e) => e.pos)).toEqual([0, 5, 20]);
  });
});

describe('pie de figura', () => {
  it('texto en español e inglés', () => {
    expect(textoDelPie('2026/06')).toBe('Edades y colores: ICS v2026/06');
    expect(textoDelPie('2026/06', 'en')).toBe('Ages and colors: ICS v2026/06');
  });

  it('una línea si cabe; si no, dos; si tampoco, null', () => {
    const pie = 'Edades y colores: ICS v2026/06';
    expect(lineasDelPie(pie, 175, 2.47)).toEqual([pie]);
    expect(lineasDelPie(pie, 30, 2.47)).toEqual(['Edades y colores:', 'ICS v2026/06']);
    expect(lineasDelPie(pie, 10, 2.47)).toBeNull();
    // Sin ': ' se corta en el espacio más cercano a la mitad
    expect(lineasDelPie('uno dos tres cuatro', 15, 2.47)).toEqual(['uno dos', 'tres cuatro']);
  });
});

describe('escala de grises', () => {
  it('blanco, negro y grises no cambian', () => {
    expect(aGris('#FFFFFF')).toBe('#FFFFFF');
    expect(aGris('#000000')).toBe('#000000');
    expect(aGris('#808080')).toBe('#808080');
    expect(aGris('#FFFF00')).toBe('#F7F7F7');
  });

  it('en todos los colores de la carta: gris, misma luminancia y mismo color de texto', () => {
    for (const x of unidades) {
      const gris = aGris(x.color);
      expect(gris, x.id).toMatch(/^#([0-9A-F]{2})\1\1$/);
      expect(Math.abs(luminancia(gris) - luminancia(x.color)), x.id).toBeLessThan(0.005);
      expect(colorDeTexto(gris), x.id).toBe(colorDeTexto(x.color));
    }
  });
});
