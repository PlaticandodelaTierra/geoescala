// Estado único de la app, su validación y su conversión a parámetros de la URL.
//
// El estado guarda lo que eligió el usuario, no la geometría. Solo se aceptan estados
// válidos: si un cambio no es válido, se rechaza y se regresan los errores para mostrarlos
// junto al control correspondiente.

import { ESCALAS, ORIENTACIONES, RANGOS } from './layout.js';
import { intervaloDeUnidades, unidadPorId } from './data.js';
import { MAX_MARCAS, TIPOS_DE_EJE } from './eje.js';
import { TERMINOLOGIAS, textoDelPie } from './labels.js';

export const MODOS = ['edad', 'nombre'];
export const IDIOMAS_DE_ETIQUETAS = ['es', 'en'];

// Tamaño permitido de la figura, en mm
export const TAMANO_MIN_MM = 1;
export const TAMANO_MAX_MM = 2000;
// Tamaño permitido de la fuente, en pt
export const FUENTE_MIN_PT = 4;
export const FUENTE_MAX_PT = 24;

export const ESTADO_POR_DEFECTO = Object.freeze({
  modo: 'edad', // intervalo por edad (techo/base) o por nombre (desde/hasta)
  techo_ma: 0,
  base_ma: 66,
  desde: 'era-cenozoico',
  hasta: 'era-cenozoico',
  rangos: Object.freeze(['periodo', 'epoca', 'edad']),
  orientacion: 'horizontal',
  invertir: false,
  escala: 'proporcional',
  ancho_mm: 175,
  alto_mm: 30,
  tamano_fuente_pt: 7,
  terminologia: 'cronoestratigrafica',
  rotar: true, // girar los nombres en celdas angostas
  eje: 'auto', // auto | intervalo | limites | ninguno
  eje_paso_ma: 10, // para eje = 'intervalo'
  incertidumbre: false, // mostrar ~ y ± en las edades de los límites
  pie: true, // pie de figura con la versión de la carta
  idioma: 'es', // idioma de las etiquetas de la figura (el de la interfaz va aparte, en i18n.js)
  grises: false, // escala de grises
});

const CAMPOS = Object.keys(ESTADO_POR_DEFECTO);

function esNumero(x) {
  return typeof x === 'number' && Number.isFinite(x);
}

/**
 * Lee un número escrito por el usuario. Acepta punto o coma decimal ('23.04', '23,04', '.5').
 * Regresa NaN si el texto no es un número positivo o cero.
 */
export function leerNumero(texto) {
  const t = String(texto ?? '').trim();
  if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) return NaN;
  return Number(t.replace(',', '.'));
}

/**
 * Errores del estado: [{ campo, codigo, datos }]. Vacío si es válido. El mensaje para el
 * usuario lo escribe i18n.js a partir del código (en español o en inglés).
 */
export function validarEstado(e, unidades) {
  const errores = [];
  const error = (campo, codigo, datos = {}) => errores.push({ campo, codigo, datos });
  const edadMaxima = Math.max(...unidades.map((u) => u.base_ma));

  for (const [campo, lista] of [
    ['modo', MODOS],
    ['orientacion', ORIENTACIONES],
    ['escala', ESCALAS],
    ['terminologia', TERMINOLOGIAS],
    ['eje', TIPOS_DE_EJE],
    ['idioma', IDIOMAS_DE_ETIQUETAS],
  ]) {
    if (!lista.includes(e[campo])) error(campo, 'valor-desconocido', { valor: e[campo] });
  }

  if (!esNumero(e.techo_ma) || e.techo_ma < 0) error('techo_ma', 'edad-joven-invalida');
  if (!esNumero(e.base_ma) || e.base_ma < 0 || e.base_ma > edadMaxima) {
    error('base_ma', 'edad-antigua-fuera-de-rango', { max: edadMaxima });
  } else if (esNumero(e.techo_ma) && e.base_ma <= e.techo_ma) {
    error('base_ma', 'edades-iguales');
  }

  for (const campo of ['desde', 'hasta']) {
    if (!unidadPorId(unidades, e[campo])) error(campo, 'elige-unidad');
  }

  if (!Array.isArray(e.rangos) || e.rangos.length === 0) {
    error('rangos', 'elige-rango');
  } else if (e.rangos.some((r) => !RANGOS.includes(r)) || new Set(e.rangos).size !== e.rangos.length) {
    error('rangos', 'rangos-invalidos');
  }

  for (const campo of ['invertir', 'rotar', 'incertidumbre', 'pie', 'grises']) {
    if (typeof e[campo] !== 'boolean') error(campo, 'si-o-no', { campo });
  }

  if (!esNumero(e.tamano_fuente_pt) || e.tamano_fuente_pt < FUENTE_MIN_PT || e.tamano_fuente_pt > FUENTE_MAX_PT) {
    error('tamano_fuente_pt', 'fuente-fuera-de-rango', { min: FUENTE_MIN_PT, max: FUENTE_MAX_PT });
  }
  if (!esNumero(e.eje_paso_ma) || e.eje_paso_ma <= 0) {
    error('eje_paso_ma', 'paso-invalido');
  } else if (e.eje === 'intervalo' && e.escala === 'proporcional') {
    const iv = intervaloDelEstado(e, unidades);
    if (iv && (iv.base_ma - iv.techo_ma) / e.eje_paso_ma > MAX_MARCAS) {
      error('eje_paso_ma', 'demasiadas-marcas', { paso: e.eje_paso_ma, max: MAX_MARCAS });
    }
  }

  for (const [campo, dimension] of [['ancho_mm', 'ancho'], ['alto_mm', 'alto']]) {
    const v = e[campo];
    if (!esNumero(v) || v < TAMANO_MIN_MM || v > TAMANO_MAX_MM) {
      error(campo, 'tamano-fuera-de-rango', { dimension, min: TAMANO_MIN_MM, max: TAMANO_MAX_MM });
    }
  }
  return errores;
}

function congelar(estado) {
  return Object.freeze({ ...estado, rangos: Object.freeze([...estado.rangos]) });
}

function iguales(a, b) {
  return CAMPOS.every((k) =>
    k === 'rangos' ? a.rangos.length === b.rangos.length && a.rangos.every((r, i) => r === b.rangos[i]) : a[k] === b[k],
  );
}

/**
 * Crea el estado. `validar(estado)` regresa la lista de errores de un estado candidato.
 * - obtener(): estado actual (congelado).
 * - actualizar(cambios): aplica los cambios si el resultado es válido y avisa a los
 *   suscriptores; regresa la lista de errores (vacía si se aplicó).
 * - suscribir(fn): fn(estado, anterior) en cada cambio; regresa una función para cancelar.
 */
export function crearEstado(inicial = ESTADO_POR_DEFECTO, validar = () => []) {
  let estado = congelar(inicial);
  const suscriptores = new Set();

  return {
    obtener: () => estado,
    actualizar(cambios) {
      const candidato = congelar({ ...estado, ...cambios });
      const errores = validar(candidato);
      if (errores.length > 0) return errores;
      if (iguales(candidato, estado)) return [];
      const anterior = estado;
      estado = candidato;
      for (const fn of suscriptores) fn(estado, anterior);
      return [];
    },
    suscribir(fn) {
      suscriptores.add(fn);
      return () => suscriptores.delete(fn);
    },
  };
}

/** Intervalo en Ma que corresponde al estado, según el modo. */
export function intervaloDelEstado(e, unidades) {
  if (e.modo === 'nombre') return intervaloDeUnidades(unidades, e.desde, e.hasta);
  return { techo_ma: e.techo_ma, base_ma: e.base_ma };
}

/** Opciones para calcularFigura() a partir del estado. `version` es la de la carta, para el pie. */
export function opcionesDeFigura(e, unidades, { version } = {}) {
  return {
    ...opcionesDeLayout(e, unidades),
    tamano_fuente_pt: e.tamano_fuente_pt,
    terminologia: e.terminologia,
    rotar: e.rotar,
    eje: e.eje,
    eje_paso_ma: e.eje_paso_ma,
    incertidumbre: e.incertidumbre,
    pie: e.pie && version ? textoDelPie(version, e.idioma) : null,
    idioma: e.idioma,
    grises: e.grises,
  };
}

/** Opciones para calcularLayout() (solo la barra) a partir del estado. */
export function opcionesDeLayout(e, unidades) {
  return {
    ...intervaloDelEstado(e, unidades),
    rangos: [...e.rangos],
    orientacion: e.orientacion,
    escala: e.escala,
    invertir: e.invertir,
    ancho_mm: e.ancho_mm,
    alto_mm: e.alto_mm,
  };
}

// --- Parámetros de la URL ---------------------------------------------------------------
//
// Se escriben todos los parámetros, no solo los que difieren del valor por defecto, para que
// un enlace muestre siempre la misma escala aunque los valores por defecto cambien.

/** Estado → 'modo=edad&techo=0&base=66&rangos=periodo,epoca,edad&…' (las edades, sin redondear). */
export function estadoAParametros(e) {
  const pares = [['modo', e.modo]];
  if (e.modo === 'nombre') pares.push(['desde', e.desde], ['hasta', e.hasta]);
  else pares.push(['techo', String(e.techo_ma)], ['base', String(e.base_ma)]);
  pares.push(
    ['rangos', e.rangos.join(',')],
    ['orientacion', e.orientacion],
    ['invertir', e.invertir ? '1' : '0'],
    ['escala', e.escala],
    ['ancho', String(e.ancho_mm)],
    ['alto', String(e.alto_mm)],
    ['fuente', String(e.tamano_fuente_pt)],
    ['terminologia', e.terminologia],
    ['rotar', e.rotar ? '1' : '0'],
    ['eje', e.eje],
  );
  if (e.eje === 'intervalo') pares.push(['paso', String(e.eje_paso_ma)]);
  pares.push(
    ['incertidumbre', e.incertidumbre ? '1' : '0'],
    ['pie', e.pie ? '1' : '0'],
    ['idioma', e.idioma],
    ['grises', e.grises ? '1' : '0'],
  );
  // Las comas se dejan sin codificar para que el enlace se pueda leer
  return pares.map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%2C/gi, ',')}`).join('&');
}

/**
 * Parámetros de la URL → { estado, avisos }. Cada parámetro ausente toma su valor por
 * defecto (o el de `porDefecto`, p. ej. el idioma de la interfaz para las etiquetas); cada
 * parámetro inválido también, y se agrega un aviso { parametro, valor, usado } para mostrarlo.
 */
export function estadoDesdeParametros(texto, unidades, porDefecto = {}) {
  const p = new URLSearchParams(texto);
  const e = { ...ESTADO_POR_DEFECTO, rangos: [...ESTADO_POR_DEFECTO.rangos], ...porDefecto };
  const avisos = [];
  const invalido = (parametro, valor, usado) => avisos.push({ parametro, valor, usado });
  const edadMaxima = Math.max(...unidades.map((u) => u.base_ma));

  if (p.has('modo')) {
    const v = p.get('modo');
    if (MODOS.includes(v)) e.modo = v;
    else invalido('modo', v, `"${e.modo}"`);
  }

  if (p.has('techo') || p.has('base')) {
    const a = leerNumero(p.get('techo'));
    const b = leerNumero(p.get('base'));
    // El orden no importa: el intervalo va de la edad menor a la mayor
    const [techo, base] = [Math.min(a, b), Math.max(a, b)];
    if (Number.isNaN(a) || Number.isNaN(b) || techo === base || base > edadMaxima) {
      invalido('techo/base', `${p.get('techo')}–${p.get('base')}`, `${e.techo_ma}–${e.base_ma} Ma`);
    } else {
      e.techo_ma = techo;
      e.base_ma = base;
    }
  }

  for (const nombre of ['desde', 'hasta']) {
    if (!p.has(nombre)) continue;
    const v = p.get(nombre);
    if (unidadPorId(unidades, v)) e[nombre] = v;
    else invalido(nombre, v, `"${e[nombre]}"`);
  }

  if (p.has('rangos')) {
    const v = p.get('rangos');
    const pedidos = v.split(',').map((r) => r.trim()).filter(Boolean);
    const validos = RANGOS.filter((r) => pedidos.includes(r));
    if (validos.length === 0) {
      invalido('rangos', v, e.rangos.join(','));
    } else {
      if (validos.length !== pedidos.length) invalido('rangos', v, validos.join(','));
      e.rangos = validos;
    }
  }

  for (const [nombre, lista] of [
    ['orientacion', ORIENTACIONES],
    ['escala', ESCALAS],
    ['terminologia', TERMINOLOGIAS],
    ['eje', TIPOS_DE_EJE],
    ['idioma', IDIOMAS_DE_ETIQUETAS],
  ]) {
    if (!p.has(nombre)) continue;
    const v = p.get(nombre);
    if (lista.includes(v)) e[nombre] = v;
    else invalido(nombre, v, `"${e[nombre]}"`);
  }

  for (const campo of ['invertir', 'rotar', 'incertidumbre', 'pie', 'grises']) {
    if (!p.has(campo)) continue;
    const v = p.get(campo);
    if (['1', 'true'].includes(v)) e[campo] = true;
    else if (['0', 'false'].includes(v)) e[campo] = false;
    else invalido(campo, v, e[campo] ? '1' : '0');
  }

  for (const [nombre, campo, min, max, unidad] of [
    ['ancho', 'ancho_mm', TAMANO_MIN_MM, TAMANO_MAX_MM, 'mm'],
    ['alto', 'alto_mm', TAMANO_MIN_MM, TAMANO_MAX_MM, 'mm'],
    ['fuente', 'tamano_fuente_pt', FUENTE_MIN_PT, FUENTE_MAX_PT, 'pt'],
  ]) {
    if (!p.has(nombre)) continue;
    const v = p.get(nombre);
    const n = leerNumero(v);
    if (n >= min && n <= max) e[campo] = n;
    else invalido(nombre, v, `${e[campo]} ${unidad}`);
  }

  if (p.has('paso')) {
    const v = p.get('paso');
    const n = leerNumero(v);
    if (n > 0) e.eje_paso_ma = n;
    else invalido('paso', v, `${e.eje_paso_ma} Ma`);
  }
  // Un paso que daría demasiadas marcas para el intervalo vuelve al valor por defecto
  if (validarEstado(e, unidades).some((x) => x.campo === 'eje_paso_ma')) {
    invalido('paso', p.get('paso'), `${ESTADO_POR_DEFECTO.eje_paso_ma} Ma`);
    e.eje_paso_ma = ESTADO_POR_DEFECTO.eje_paso_ma;
  }

  return { estado: congelar(e), avisos };
}
