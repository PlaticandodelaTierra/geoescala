// Pruebas del estado y de su conversión a parámetros de la URL (src/state.js).
import { describe, expect, it, vi } from 'vitest';
import datos from '../data/ics-2026-06.json';
import { TEXTOS } from '../src/i18n.js';
import { calcularLayout } from '../src/layout.js';
import {
  crearEstado,
  ESTADO_POR_DEFECTO,
  estadoAParametros,
  estadoDesdeParametros,
  intervaloDelEstado,
  leerNumero,
  opcionesDeFigura,
  opcionesDeLayout,
  validarEstado,
} from '../src/state.js';

const unidades = datos.unidades;
const validar = (e) => validarEstado(e, unidades);
const nuevoEstado = () => crearEstado(ESTADO_POR_DEFECTO, validar);

describe('leerNumero', () => {
  it.each([
    ['23.04', 23.04],
    ['23,04', 23.04],
    [' 66 ', 66],
    ['0', 0],
    ['0.0117', 0.0117],
    ['.5', 0.5],
    [',5', 0.5],
    ['175.', 175],
  ])('"%s" → %s', (texto, n) => {
    expect(leerNumero(texto)).toBe(n);
  });

  it.each(['', '   ', 'abc', '-1', '1,2,3', '1.2.3', '1e3', '12 mm', null, undefined])('"%s" → NaN', (texto) => {
    expect(leerNumero(texto)).toBeNaN();
  });
});

describe('validarEstado', () => {
  it('el estado por defecto es válido', () => {
    expect(validar(ESTADO_POR_DEFECTO)).toEqual([]);
  });

  it.each([
    ['techo_ma', { techo_ma: -1 }],
    ['base_ma', { techo_ma: 10, base_ma: 10 }],
    ['base_ma', { base_ma: 5000 }],
    ['base_ma', { base_ma: Number.NaN }],
    ['desde', { desde: 'no-existe' }],
    ['hasta', { hasta: '' }],
    ['rangos', { rangos: [] }],
    ['rangos', { rangos: ['sistema'] }],
    ['rangos', { rangos: ['edad', 'edad'] }],
    ['orientacion', { orientacion: 'diagonal' }],
    ['invertir', { invertir: 'si' }],
    ['escala', { escala: 'logaritmica' }],
    ['ancho_mm', { ancho_mm: 0 }],
    ['alto_mm', { alto_mm: 3000 }],
    ['modo', { modo: 'otro' }],
    ['tamano_fuente_pt', { tamano_fuente_pt: 3 }],
    ['tamano_fuente_pt', { tamano_fuente_pt: 30 }],
    ['terminologia', { terminologia: 'otra' }],
    ['rotar', { rotar: 1 }],
    ['eje', { eje: 'log' }],
    ['eje_paso_ma', { eje_paso_ma: 0 }],
    ['eje_paso_ma', { eje: 'intervalo', eje_paso_ma: 0.01 }], // 6600 marcas en 0–66 Ma
    ['incertidumbre', { incertidumbre: 'no' }],
    ['pie', { pie: 'si' }],
    ['grises', { grises: 1 }],
    ['idioma', { idioma: 'fr' }],
  ])('señala el campo %s', (campo, cambios) => {
    const errores = validar({ ...ESTADO_POR_DEFECTO, ...cambios });
    expect(errores.map((e) => e.campo)).toEqual([campo]);
    expect(errores[0].codigo).toMatch(/^[a-z-]+$/);
    expect(`error.${errores[0].codigo}` in TEXTOS.es).toBe(true);
  });
});

describe('crearEstado', () => {
  it('aplica cambios válidos y avisa con el estado nuevo y el anterior', () => {
    const estado = nuevoEstado();
    const fn = vi.fn();
    estado.suscribir(fn);
    expect(estado.actualizar({ escala: 'uniforme' })).toEqual([]);
    expect(estado.obtener().escala).toBe('uniforme');
    expect(fn).toHaveBeenCalledTimes(1);
    const [nuevo, anterior] = fn.mock.calls[0];
    expect(nuevo.escala).toBe('uniforme');
    expect(anterior.escala).toBe('proporcional');
  });

  it('rechaza cambios inválidos: regresa los errores, no cambia ni avisa', () => {
    const estado = nuevoEstado();
    const fn = vi.fn();
    estado.suscribir(fn);
    const errores = estado.actualizar({ rangos: [], ancho_mm: 0 });
    expect(errores.map((e) => e.campo).sort()).toEqual(['ancho_mm', 'rangos']);
    expect(estado.obtener()).toEqual(ESTADO_POR_DEFECTO);
    expect(fn).not.toHaveBeenCalled();
  });

  it('no avisa si nada cambió', () => {
    const estado = nuevoEstado();
    const fn = vi.fn();
    estado.suscribir(fn);
    estado.actualizar({ escala: 'proporcional', rangos: ['periodo', 'epoca', 'edad'] });
    expect(fn).not.toHaveBeenCalled();
  });

  it('se puede cancelar la suscripción', () => {
    const estado = nuevoEstado();
    const fn = vi.fn();
    const cancelar = estado.suscribir(fn);
    cancelar();
    estado.actualizar({ invertir: true });
    expect(fn).not.toHaveBeenCalled();
  });

  it('el estado no se puede modificar por fuera', () => {
    const e = nuevoEstado().obtener();
    expect(Object.isFrozen(e)).toBe(true);
    expect(Object.isFrozen(e.rangos)).toBe(true);
  });
});

describe('intervalo y opciones de layout', () => {
  it('por edad usa techo y base; por nombre, las dos unidades', () => {
    const porEdad = { ...ESTADO_POR_DEFECTO, techo_ma: 10, base_ma: 30 };
    expect(intervaloDelEstado(porEdad, unidades)).toEqual({ techo_ma: 10, base_ma: 30 });
    const porNombre = { ...porEdad, modo: 'nombre', desde: 'epoca-holoceno', hasta: 'epoca-mioceno' };
    expect(intervaloDelEstado(porNombre, unidades)).toEqual({ techo_ma: 0, base_ma: 23.04 });
  });

  it('opcionesDeFigura arma el texto del pie con la versión de la carta', () => {
    expect(opcionesDeFigura(ESTADO_POR_DEFECTO, unidades, { version: '2026/06' }).pie).toBe(
      'Edades y colores: ICS v2026/06',
    );
    expect(opcionesDeFigura({ ...ESTADO_POR_DEFECTO, pie: false }, unidades, { version: '2026/06' }).pie).toBeNull();
    expect(opcionesDeFigura(ESTADO_POR_DEFECTO, unidades).pie).toBeNull();
    const { estado } = estadoDesdeParametros('pie=0', unidades);
    expect(estado.pie).toBe(false);
  });

  it('opcionesDeLayout sirve para calcularLayout', () => {
    const e = { ...ESTADO_POR_DEFECTO, orientacion: 'vertical', ancho_mm: 24, alto_mm: 175, invertir: true };
    const op = opcionesDeLayout(e, unidades);
    expect(op).toEqual({
      techo_ma: 0,
      base_ma: 66,
      rangos: ['periodo', 'epoca', 'edad'],
      orientacion: 'vertical',
      escala: 'proporcional',
      invertir: true,
      ancho_mm: 24,
      alto_mm: 175,
    });
    expect(calcularLayout(unidades, op).celdas.length).toBeGreaterThan(0);
  });
});

describe('parámetros de la URL', () => {
  it('escribe todos los parámetros, legibles', () => {
    expect(estadoAParametros(ESTADO_POR_DEFECTO)).toBe(
      'modo=edad&techo=0&base=66&rangos=periodo,epoca,edad&orientacion=horizontal' +
        '&invertir=0&escala=proporcional&ancho=175&alto=30' +
        '&fuente=7&terminologia=cronoestratigrafica&rotar=1&eje=auto&incertidumbre=0&pie=1&idioma=es&grises=0',
    );
  });

  it('escribe el paso de las marcas solo si el eje va a intervalo fijo', () => {
    expect(estadoAParametros({ ...ESTADO_POR_DEFECTO, eje: 'intervalo', eje_paso_ma: 2.5 })).toContain(
      '&eje=intervalo&paso=2.5&incertidumbre=0',
    );
    expect(estadoAParametros(ESTADO_POR_DEFECTO)).not.toContain('paso=');
  });

  it('un enlace de antes de la Fase 4 sigue funcionando con los valores por defecto', () => {
    const viejo = 'modo=edad&techo=0&base=23.04&rangos=epoca,edad&orientacion=vertical&invertir=1&escala=uniforme&ancho=24&alto=175';
    const { estado, avisos } = estadoDesdeParametros(viejo, unidades);
    expect(avisos).toEqual([]);
    expect(estado).toMatchObject({ base_ma: 23.04, alto_mm: 175, tamano_fuente_pt: 7, eje: 'auto', rotar: true });
  });

  it('en el modo por nombre escribe las unidades en lugar de las edades', () => {
    const e = { ...ESTADO_POR_DEFECTO, modo: 'nombre', desde: 'epoca-mioceno', hasta: 'epoca-holoceno' };
    const texto = estadoAParametros(e);
    expect(texto).toContain('modo=nombre&desde=epoca-mioceno&hasta=epoca-holoceno&rangos=');
    expect(texto).not.toContain('techo=');
  });

  it.each([
    ['por defecto', {}],
    ['edades con decimales, sin redondear', { techo_ma: 0.0117, base_ma: 23.04 }],
    ['límite con ±', { techo_ma: 251.902, base_ma: 259.857 }],
    [
      'por nombre, vertical, invertida, uniforme',
      {
        modo: 'nombre',
        desde: 'piso-2',
        hasta: 'epoca-pridoliano',
        orientacion: 'vertical',
        invertir: true,
        escala: 'uniforme',
        rangos: ['eon', 'edad'],
        ancho_mm: 30.5,
        alto_mm: 120,
      },
    ],
    [
      'etiquetas y eje',
      {
        tamano_fuente_pt: 6.5,
        terminologia: 'geocronologica',
        rotar: false,
        eje: 'intervalo',
        eje_paso_ma: 2.5,
        incertidumbre: true,
      },
    ],
    ['eje de límites', { eje: 'limites', incertidumbre: true }],
  ])('ida y vuelta: %s', (_, cambios) => {
    const e = { ...ESTADO_POR_DEFECTO, ...cambios };
    const { estado, avisos } = estadoDesdeParametros(estadoAParametros(e), unidades);
    expect(avisos).toEqual([]);
    const comparar = (x) =>
      x.modo === 'nombre' ? { ...x, techo_ma: undefined, base_ma: undefined } : { ...x, desde: undefined, hasta: undefined };
    expect(comparar(estado)).toEqual(comparar(e));
    expect(validar(estado)).toEqual([]);
  });

  it('sin parámetros da el estado por defecto, sin avisos', () => {
    expect(estadoDesdeParametros('', unidades)).toEqual({ estado: ESTADO_POR_DEFECTO, avisos: [] });
  });

  it('acepta "?" inicial, parámetros parciales y las edades en cualquier orden', () => {
    const { estado, avisos } = estadoDesdeParametros('?techo=66&base=0&escala=uniforme', unidades);
    expect(avisos).toEqual([]);
    expect(estado).toMatchObject({ techo_ma: 0, base_ma: 66, escala: 'uniforme', orientacion: 'horizontal' });
  });

  it('ignora los parámetros desconocidos', () => {
    expect(estadoDesdeParametros('fbclid=abc&tema=oscuro', unidades)).toEqual({
      estado: ESTADO_POR_DEFECTO,
      avisos: [],
    });
  });

  it.each([
    ['modo=otro', 'modo'],
    ['techo=abc&base=66', 'techo/base'],
    ['techo=10&base=10', 'techo/base'],
    ['techo=0&base=9999', 'techo/base'],
    ['desde=no-existe', 'desde'],
    ['rangos=sistema,serie', 'rangos'],
    ['orientacion=diagonal', 'orientacion'],
    ['escala=log', 'escala'],
    ['invertir=si', 'invertir'],
    ['ancho=0', 'ancho'],
    ['alto=-5', 'alto'],
    ['fuente=100', 'fuente'],
    ['terminologia=otra', 'terminologia'],
    ['rotar=si', 'rotar'],
    ['eje=log', 'eje'],
    ['paso=0', 'paso'],
    ['paso=-1', 'paso'],
    ['incertidumbre=2', 'incertidumbre'],
    ['pie=quizas', 'pie'],
    ['idioma=fr', 'idioma'],
    ['grises=si', 'grises'],
  ])('un parámetro inválido (%s) usa el valor por defecto y avisa', (texto, nombre) => {
    const { estado, avisos } = estadoDesdeParametros(texto, unidades);
    expect(estado).toEqual(ESTADO_POR_DEFECTO);
    expect(avisos).toHaveLength(1);
    expect(avisos[0].parametro).toBe(nombre);
  });

  it('un paso que daría demasiadas marcas vuelve al valor por defecto y avisa', () => {
    const { estado, avisos } = estadoDesdeParametros('eje=intervalo&paso=0.001', unidades); // 66 000 marcas
    expect(estado).toMatchObject({ eje: 'intervalo', eje_paso_ma: 10 });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toEqual({ parametro: 'paso', valor: '0.001', usado: '10 Ma' });
    expect(validar(estado)).toEqual([]);
  });

  it('de una lista de rangos conserva los válidos y avisa por los demás', () => {
    const { estado, avisos } = estadoDesdeParametros('rangos=edad,sistema,periodo', unidades);
    expect(estado.rangos).toEqual(['periodo', 'edad']);
    expect(avisos).toHaveLength(1);
  });

  it('los parámetros válidos se usan aunque otros sean inválidos', () => {
    const { estado, avisos } = estadoDesdeParametros('escala=uniforme&ancho=abc&alto=30', unidades);
    expect(estado).toMatchObject({ escala: 'uniforme', ancho_mm: 175, alto_mm: 30 });
    expect(avisos).toHaveLength(1);
  });
});

describe('idioma de las etiquetas y escala de grises', () => {
  it('se escriben en la URL y se leen de vuelta', () => {
    const e = { ...ESTADO_POR_DEFECTO, idioma: 'en', grises: true };
    const texto = estadoAParametros(e);
    expect(texto).toContain('&idioma=en&grises=1');
    expect(estadoDesdeParametros(texto, unidades)).toEqual({ estado: e, avisos: [] });
  });

  it('sin idioma en el enlace, se usa el que se pida por defecto (el de la interfaz)', () => {
    expect(estadoDesdeParametros('', unidades, { idioma: 'en' }).estado.idioma).toBe('en');
    expect(estadoDesdeParametros('idioma=es', unidades, { idioma: 'en' }).estado.idioma).toBe('es');
  });

  it('opcionesDeFigura pasa el idioma y los grises, y escribe el pie en ese idioma', () => {
    const op = opcionesDeFigura({ ...ESTADO_POR_DEFECTO, idioma: 'en', grises: true }, unidades, { version: '2026/06' });
    expect(op).toMatchObject({ idioma: 'en', grises: true, pie: 'Ages and colors: ICS v2026/06' });
  });
});
